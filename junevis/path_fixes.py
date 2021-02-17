"""Fix the paths to important folders in this repository."""

from pathlib import Path
import os

JUNEVIS = Path(
    os.path.abspath(__file__)
).parent
ROOT = JUNEVIS.parent  # Root directory of the github project
CLIENT = JUNEVIS / "client"
PUBLIC = CLIENT / "public"
DIST = CLIENT / "dist"
DEMO = PUBLIC / "demo"
PROJECTS = DEMO / "projects"
DEFAULT_GEOJSON = DEMO / "coxs_bazar.geojson"
AVAILABLE_PROJECTS = DEMO / "availableProjects.txt"