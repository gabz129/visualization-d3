setwd("~/Maestria/Visualizacion de la informacion/TP3/git/visualization-d3/data/")
library(geosphere)
library("dplyr")
# Se setea para que R trabaje con 22 decimales
options("digits" = 22)

cities = read.csv(file = "cities.csv", encoding = "UTF-8")
lines = read.csv(file = "lines.csv", encoding = "UTF-8")
stations = read.csv(file = "stations.csv", encoding = "UTF-8")
systems = read.csv(file = "systems.csv", encoding = "UTF-8")
pbi = read.csv(file = "pbi.csv", encoding = "UTF-8", stringsAsFactors = F)

pbi[pbi$Country.Name == 'United Kingdom',]$Country.Name = "England"
pbi_2 = data.frame()
for( country in  c("Argentina", "Italy", "Spain", "France", "Japan", "China", "Chile", "Mexico", "Portugal", "England")) {
  for ( p in colnames(pbi[pbi$Country.Name == country,][, 6:ncol(pbi)-1]) ) {
    pbi_2 = rbind(pbi_2, cbind(country = country, year = as.integer(gsub("X", "", p)), pbi = pbi[pbi$Country.Name == country,][, 6:ncol(pbi)-1][[p]] ))
  }
}
pbi = pbi_2

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
data = data[ (is.na(data$station_closure) | data$station_closure > 2020), ]
data = data[ (!is.na(data$station_opening) & data$station_opening > 0 & data$station_opening < 2030 ), ]

data = data[with(data, order(line_id, station_lat, station_lon)),]
by_line <- data %>% group_by(line_id)

by_line$line_meters = NA
by_line$line_meters_acumulated = NA
by_line$station_meters = NA

for ( group_ID in unique(group_indices(by_line)) ) {
  line = by_line[group_indices(by_line) == group_ID,]
  
  sort_stations_lon = line[with(line, order(station_lon, station_lat)),]
  sort_stations_lat = line[with(line, order(station_lat, station_lon)),]
  
  if (  sort_stations_lon[1,]$station_opening > sort_stations_lon[nrow(sort_stations_lon),]$station_opening ) {
    sort_stations_lon = line[with(line, order(station_lon, station_lat, decreasing = T)),]
  }
  if (  sort_stations_lon[1,]$station_opening > sort_stations_lon[nrow(sort_stations_lon),]$station_opening ) {
    sort_stations_lat = line[with(line, order(station_lat, station_lon, decreasing = T)),]
  }
  
  d1 = round(distm(sort_stations_lon[, c('station_lon', 'station_lat')], fun = distHaversine))
  d2 = round(distm(sort_stations_lat[, c('station_lon', 'station_lat')], fun = distHaversine))
  distance = d1
  if( is.unsorted(d1[,1]) ) {
    distance = d2
    rownames(distance) = sort_stations_lat$station_id
    colnames(distance) = sort_stations_lat$station_id
  } else {
    distance = d1
    rownames(distance) = sort_stations_lon$station_id
    colnames(distance) = sort_stations_lon$station_id
  }
  
  aux = NA
  lineMeters = 0
  for ( station_id in rownames(distance) ) {
    by_line[by_line$station_id == station_id,]$line_meters_acumulated = distance[[station_id, 1]]
    lineMeters = lineMeters + ifelse( is.na(aux), 0,  distance[[station_id, aux]])
    by_line[by_line$station_id == station_id,]$station_meters = ifelse( is.na(aux), 0,  distance[[station_id, aux]])
    aux = station_id
  }
  # only the last station has line meters seted
  by_line[by_line$station_id == station_id,]$line_meters = lineMeters
}

# lines examples
#View(by_line[by_line$line_id == 9, c("line_id", "station_opening", "station_name", "station_closure", "line_meters", "line_meters_acumulated", "station_lat", "station_lon")])
#View(by_line[by_line$line_id == 382, c("line_id", "station_opening", "station_name", "station_closure", "line_meters", "line_meters_acumulated", "station_lat", "station_lon")])
#View(by_line[group_indices(by_line) == line_id, ])

library(RSQLite)

db <- dbConnect(SQLite(), dbname="myDB.sqlite")
dbWriteTable(conn = db, name = "underground", ungroup(by_line), overwrite=T, row.names=T)
dbWriteTable(conn = db, name = "pbi", pbi, overwrite=T, row.names=T)
dbGetQuery(conn=db, "SELECT city_country, count(distinct line_id) cant FROM underground group by city_country order by cant desc")
dbGetQuery(conn=db, "SELECT * FROM pbi desc")
dbGetQuery(conn=db, "SELECT * FROM years ")

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


dbSendQuery(conn = db,
            "CREATE TABLE YEARS
            (year INTEGER)")
dbSendQuery(conn=db, "delete from YEARS")
for ( year in 1840:2018) {
  dbSendQuery(conn = db,
              paste0("INSERT INTO YEARS
                     VALUES (", year , ")"))  
}

dbGetQuery(conn=db, "select * from YEARS limit 5")

options("digits" = 7)

View(dbGetQuery(conn=db, " select * from underground where station_id = 100"))

data_to_export2 = dbGetQuery(conn=db, "
select 
 city_country city_country, 
 y.year year, 
 coalesce( cast(pbi.pbi as number), 0) pbi,
 coalesce(sum(u.station_meters/ (u.station_opening - u.station_buildstart) ), 0) meters
 from YEARS y
 join pbi on y.year = pbi.year
 left join underground u on pbi.country = u.city_country and y.year between u.station_buildstart and u.station_opening
 where pbi.country = 'Chile' and y.year between u.station_buildstart and u.station_opening and  ( u.city_country is null or
 ( 
 u.system_name like '%subte%' 
 or u.system_name like 'underground' 
 or u.system_name like '%metro%' 
 or u.system_name like '%sub%' 
 or u.system_name like 'Métro%')
 )
 group by 
 city_country, 
 y.year, 
 pbi.pbi
 ")

data_to_export = dbGetQuery(conn=db, 
                            "SELECT city_country, line_id, station_id, station_opening, line_name, station_name, station_meters, line_meters, line_meters_acumulated
                            FROM underground 
                            where system_name like '%subte%' 
                            or system_name like 'underground' 
                            or system_name like '%metro%' 
                            or system_name like '%sub%' 
                            or system_name like 'Métro%'
                            order by line_id,  line_meters_acumulated  ")



db2 <- dbConnect(SQLite(), dbname="myDB2.sqlite")
dbWriteTable(conn = db2, name = "underground2", data_to_export, overwrite=T, row.names=T)


View(dbGetQuery(conn=db2, 
                "SELECT city_country, station_opening, sum(station_meters)
                FROM underground2 
                group by city_country, station_opening
                "))


ll= dbGetQuery(conn=db2, 
"SELECT city_country, station_opening, sum(station_meters) meters
FROM underground2 
where station_opening < '2016'
group by city_country, station_opening
")

library(ggplot2)
ggplot(ll, aes(city_country, meters/1000, fill=factor(city_country))) +
  geom_boxplot()

View(data_to_export)


# Exporting data to json
library(jsonlite)


json = toJSON(data_to_export, pretty = T)
json2 = toJSON(data_to_export2, pretty = T)
write(json, "lines.json")
write(json2, "pbi.json")
