setwd("~/Visualizacion de la informacion/TP3/")
library(geosphere)
library("dplyr")
# Se setea para que R trabaje con 22 decimales
options("digits" = 22)

cities = read.csv(file = "cities.csv", encoding = "UTF-8")
lines = read.csv(file = "lines.csv", encoding = "UTF-8")
stations = read.csv(file = "stations.csv", encoding = "UTF-8")
systems = read.csv(file = "systems.csv", encoding = "UTF-8")


stations$lat = NA
stations$lon = NA
g = regmatches(stations$geometry, gregexpr("-*\\d+.\\d+e*-*\\d+", stations$geometry), invert = F)
for( i in 1:length(g) ) {
  stations[i,]$lat = as.double(g[[i]][2])
  stations[i,]$lon = as.double(g[[i]][1])
}
# Se quita la vieja columna geometry
stations = stations[c(-4)]


#Punto 1
#Evolucion de construction de km por año
#Percentiles-75/Media distancia entre estaciones por linea por pais

# Se renombran las columnas para evitar autorenombre de columnas con mismo nombre
colnames(cities) = paste0("city_", colnames(cities))
colnames(lines) = paste0("line_", colnames(lines))
colnames(stations) = paste0("station_", colnames(stations))
colnames(systems) = paste0("system_", colnames(systems))

# Joins de las tablas
data = merge(cities, lines, all.y = TRUE, by.x = "city_id", by.y = "line_city_id")
data = merge(data, stations, all.y = T, by.x = "line_id", by.y = "station_line_id")
data = merge(data, systems, all.x = T, by.x = "line_system_id", by.y = "system_id")

#Se eliminan las estaciones clausuradas
data = data[ (data$station_closure > 2020 | is.na(data$station_closure)), ]

data = data[with(data, order(line_id, station_lat, station_lon)),]
by_line <- data %>% group_by(line_id)

by_line$line_meters = NA
by_line$line_meters_acumulated = NA

for ( group_ID in unique(group_indices(by_line)) ) {
  line = by_line[group_indices(by_line) == group_ID,]

  sort_stations_lon = line[with(line, order(station_lon, station_lat)),]
  sort_stations_lat = line[with(line, order(station_lat, station_lon)),]
  
  d1 = round(distm(sort_stations_lon[, c('station_lon', 'station_lat')], fun = distHaversine))
  d2 = round(distm(sort_stations_lat[, c('station_lon', 'station_lat')], fun = distHaversine))
  distance = d1
  if( is.unsorted(d1[,1]) ) {
    distance = d2
    rownames(distance) = sort_stations_lat$station_id
  } else {
    distance = d1
    rownames(distance) = sort_stations_lon$station_id
  }
  
  for ( station_id in rownames(distance) ) {
    by_line[by_line$station_id == station_id,]$line_meters_acumulated = distance[[station_id, 1]]
  }
  # only de last station has line meters seted
  by_line[by_line$station_id == station_id,]$line_meters = max(distance[,1])
}

# lines examples
#View(by_line[by_line$line_id == 5, c("line_id", "station_opening", "station_name", "station_closure", "line_meters", "line_meters_acumulated", "station_lat", "station_lon")])
#View(by_line[by_line$line_id == 382, c("line_id", "station_opening", "station_name", "station_closure", "line_meters", "line_meters_acumulated", "station_lat", "station_lon")])
#View(by_line[group_indices(by_line) == line_id, ])

library(RSQLite)

db <- dbConnect(SQLite(), dbname="myDB.sqlite")
dbWriteTable(conn = db, name = "underground", ungroup(by_line), overwrite=T, row.names=T)
dbGetQuery(conn=db, "SELECT city_country, count(distinct line_id) cant FROM underground group by city_country order by cant desc")

d = dbGetQuery(conn=db, 
"SELECT distinct city_country, sum(line_meters), group_concat(distinct line_name)
FROM underground 
where system_name like '%subte%' 
or system_name like 'underground' 
or system_name like '%metro%' 
or system_name like '%sub%' 
or system_name like 'Métro%'
group by city_country
order by 2 desc")

#View(d)

data_to_export = dbGetQuery(conn=db, 
"SELECT city_country, line_id, station_id, station_opening, line_name, station_name, line_meters, line_meters_acumulated
FROM underground 
where system_name like '%subte%' 
or system_name like 'underground' 
or system_name like '%metro%' 
or system_name like '%sub%' 
or system_name like 'Métro%'
order by line_id,  line_meters_acumulated  ")

#View(data_to_export)


# Exporting data to json
library(jsonlite)


json = toJSON(data_to_export, pretty = T)
write(json, "lines.json")
