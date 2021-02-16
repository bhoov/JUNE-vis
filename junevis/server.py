import argparse
from typing import *
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import junevis.path_fixes as pf

parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument("--port", default=8000, type=int, help="Port to run the app. ")
parser.add_argument("--dist", default=pf.DIST, type=str, help="Path to the dist folder containing HTML+JS+CSS")

args, _ = parser.parse_known_args()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================================================
## Simple Static File Server ##
# ======================================================================
@app.get("/")
async def index():
    """For local development, serve the index.html in the dist folder"""
    return RedirectResponse(url="/index.html")

# the `file_path:path` says to accept any path as a string here. Otherwise, `file_paths` containing `/` will not be served properly
@app.get("/{file_path:path}")
async def send_static_client(file_path:str):
    """ Serves (makes accessible) all files from ./client/ to ``/client/{path}``. Used primarily for development. NGINX handles production.

    Args:
        path: Name of file in the client directory
    """
    f = str(args.dist / file_path)
    print("Finding file: ", f)
    return FileResponse(f)

@app.exception_handler(HTTPException)
async def notfound_exception_handler(request, exc):
    """Catch all response, redirect to index. Necessary when using Vue Router"""
    return RedirectResponse(url="/index.html")

def run():
    uvicorn.run("junevis.server:app", host='127.0.0.1', port=args.port)

if __name__ == "__main__":
    run()
    
