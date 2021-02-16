"""Convert pickle config file into a json"""
import click
import pickle
from pathlib import Path
import json
import numpy as np
from typing import *

def jsonify_params(params):
    """Some params are given as numpy values that are not json serializable. Fix"""
    out = {}
    for k, v in params.items():
        if type(v) == np.bool_:
            out[k] =bool(v)
        else:
            out[k] = v
    return out

def fix_pickle(pickle_file: str, description: str, run_names: Optional[List[str]]=None):

    with open(pickle_file, 'rb') as fp:
        data = pickle.load(fp)

    parameters_varied = set([])
    for d in data:
        for k in d.keys():
            if k not in parameters_varied:
                parameters_varied.add(k)
                
    if run_names is None:
        run_names = range(len(data))

    run_parameters = {k: jsonify_params(o) for k, o in zip(run_names,data)}

    json_info = {
        "description": description,
        "parameters_varied": list(parameters_varied),
        "run_parameters": run_parameters
    }

    return json_info

def pckl2json(pickle_file: str, outfile: str=None, description: str="", run_names:Optional[List[str]]=None):
    conf = Path(pickle_file)
    outfile = conf.parent / "metadata.json" if outfile is None else outfile
    json_info = fix_pickle(conf, description, run_names)

    with open(outfile, "w") as fp:
        json.dump(json_info, fp)

@click.command()
@click.option("--pickle_file", "-p", help='Pickle file to convert')
@click.option("--outfile", "-o", default=None, help='JSON output file. If not given, default to same folder as pickle')
@click.option("--description", "-d", default="", help='Description to add to the metadata file. Default to empty string')
def main(pickle_file: str, outfile: str, description: str):
    pckl2json(pickle_file, outfile, description)

if __name__ == "__main__":
    main()