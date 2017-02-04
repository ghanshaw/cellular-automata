# Simulacra

Simulacra is an implementation of Conway's Game of Life built with [Django Channels][0]. This project also makes
 extensive use of HTML/CSS, Javascript, and D3.js.

You can see a working demo [here][1].

## Overview

Many readers will be familiar with the rules of Conway's Game of Life. Please refer to [Wikipedia][2] if you want
 to learn more about this game. This simulation is built using Django Channels. This means that expensive iterations
 are done on the backend. Also, the composition of each iteration is also stored on the backend.

Rather than creating and updating a grid, the game tracks only living cells and their locations,
 which allows for the grid to be essentially infinite (limited by the number of living cells that the game will allow but
 without finite boundaries for the plane). The server communicates the position of living cells to the client via
 WebSockets, and the client updates the canvas accordingly.

Users can add living cells to the game by dragging and dropping patterns or drawing directly on the canvas.

The dashboard to the right of the board keeps tracks of the number of living cells at any given time. This allows users
 to observe how quickly and successfully certain patterns propagate. The dashboard also includes a timeline which
  allows users to observe different points in the pattern's "history" or to edit that history by revisiting a previous
   iteration and then changing the pattern.


## Technologies

- Python 3.6
- Django 1.10
- Django Channels 1.0.2
- D3 4.0
- Twitter Bootstrap 3
- jQuery 2

## Installation Guide

### 1. Install Python 3.6 and pip

Please visit the [Python][3] website to learn more.


### 2. Clone the repository

Via https

```bash
git clone https://github.com/ghanshaw/simulacra.git
```

or via ssh
```bash
git clone git@github.com:ghanshaw/simulacra.git
```

### 3. Install dependencies
Use the requirement.txt file, located in the root, to install all of the dependencies before running Simulacra.  It
is **strongly recommended** that you create and activate a virtual environment before installing dependencies.

```bash
pip install -r requirements.txt
```

### 4. Sync databases

```bash
python manage.py make migrations
python manage.py migrate
```

### 5. Load data into django project

The simulation utilizes information about the included patterns which should be loaded into the models. This data is
stored in a JSON file.


```bash
python  manage.py loaddata initial_data.json
```

### 5. Activate redis

As explained in the Channels documentation, the Redis layer is the recommended backend to run Channels with. If it is
not already present and active on your localhost, your will need to install it.

Install it
```bash
brew install redis
```
And then start it up
```bash
redis-start
```

Confirm that the server is running.
```bash
redis-cli ping
PONG
```




### 7. Run

```bash
python manage.py runserver
```

**Note:** Many of the settings have been adapted to prepare the project for deployment, specifically on Heroku.
If you encounter difficulty running the project, refer to previous versions of the project before it was adapted for
Heroku. Consider installing a vanilla version of Django and transferring files as necessary.



[0]: https://channels.readthedocs.io/en/stable/
[1]: http://www.simulacra.tech
[2]: https://en.wikipedia.org/wiki/Conway's_Game_of_Life
[3]: https://www.python.org/

