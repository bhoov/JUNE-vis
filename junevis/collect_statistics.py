""" Step 2: Collect global statistics from small CSVs necessary for visualization """
import pandas as pd
from pathlib import Path
import click
import json
from typing import *

def collect_statistics(project: Union[str, Path], outf: Union[str, Path]):
    project = Path(project)
    csvfs = list(project.glob("summary*.csv"))
    dfs = [pd.read_csv(csvf) for csvf in csvfs]
    big_df = pd.concat(dfs, ignore_index=True)

    all_regions = list(set(big_df.region))
    all_fields = [f for f in big_df.columns if f != "Unnamed: 0"]
    all_timestamps = list(set(big_df.timestamp))

    string_fields = ["timestamp", "region", "Unnamed: 0"]
    numerical_fields = [f for f in all_fields if f not in string_fields]
    big_df_num = big_df.loc[:, numerical_fields]
    max_vals = big_df_num.max(axis=0)
    min_vals = big_df_num.min(axis=0)

    df_minmax = pd.DataFrame([max_vals, min_vals], index=["max", "min"])
    field_minmaxes = df_minmax.to_dict(orient="dict")

    # Insert into metadata
    metadata_f = project / "metadata.json"
    with open(metadata_f, 'r') as fp:
        metadata = json.load(fp)

    metadata["all_regions"] = sorted(all_regions)
    metadata["all_timestamps"] = sorted(all_timestamps)
    metadata["all_fields"] = sorted(all_fields)
    metadata["field_statistics"] = field_minmaxes

    with open(outf, 'w') as fp:
        json.dump(metadata, fp)

@click.command()
@click.option("--project", "-p", type=str, help="Project directory containing 'summary*.csv's and 'metadata.json'")
@click.option("--outf", "-o", type=str, default=None, help="Where to save new metadata. If None, overwrite")
def main(project:str, outf: str):
    project = Path(project)
    if outf is None:
        outf = project / "metadata.json"
    collect_statistics(project, outf)

if __name__ == "__main__":
    main()