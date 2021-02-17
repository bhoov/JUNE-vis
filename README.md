# JUNE-vis
> A dashboard to visualize the JUNE simulation results for epidemic modeling and intervention


## Install

`pip install junevis`

## Serve the Example Project

This code ships with an example project (`learning_centers`) for the interface. From the command line, run:

`junevis_serve` 

## Add new simulation results to JUNE-vis

The `JUNE` simulation logs events as they occur into hdf5 files called `records`. These are transformed into csv files called `summaries` that are automatically placed into a folder the frontend interface can serve. To create a new visualization from a simulation,

`junevis_create path/to/folder/containing/records`

For more details on the expected contents of this folder, see `create_project.py`

## Known Bugs

- Rendering the geojson associated with the map of England does not work
