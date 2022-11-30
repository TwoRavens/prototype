
doubler <- function(number) {
  list(newvalue = number * 2)
}

apps <- list(doubler = doubler)

handler <- function(app, data) {
  apps[[app]](data)
}