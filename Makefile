.ONESHELL:
SHELL := /bin/bash
SRC = $(wildcard nbs/*.ipynb)

all: junevis docs

junevis: $(SRC)
	nbdev_build_lib
	touch junevis

sync:
	nbdev_update_lib

docs_serve: docs
	cd docs && bundle exec jekyll serve

docs: $(SRC)
	nbdev_build_docs
	touch docs

test:
	nbdev_test_nbs

prep:
	nbdev_clean_nbs
	nbdev_build_lib
	nbdev_build_docs

bump:
	nbdev_clean_nbs
	nbdev_build_docs
	nbdev_bump_version

release: pypi conda_release
	nbdev_bump_version

conda_release:
	fastrelease_conda_package

pypi: dist
	twine upload --repository pypi dist/*

dist: clean
	python setup.py sdist bdist_wheel

setup: 
	nbdev_build_lib
	pip install -e .

clean:
	rm -rf dist