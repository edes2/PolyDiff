# PolyDiff: Multiplayer Spot‑the‑Difference

Project date: October 2023 (Third-year university project)

PolyDiff is a real‑time, multiplayer “spot the difference” game built for the LOG3900 course. It includes an Angular web client and a Flutter mobile app, a Node/Express server for gameplay orchestration and image processing, and an optional FastAPI service for chat. The stack leverages Firebase Authentication and WebSockets (Socket.IO) for secure, low‑latency gameplay with user accounts, game rooms, histories, ratings, and leaderboards.

## Installation Guide

-   client: the web app built with **Angular**.
-   server: the backend built with **Express** (or **NestJS**, depending on your choice).

## Local Deployment: Node server and web client

1. Install `npm`. `npm` comes with `Node`, which you can download [here](https://nodejs.org/en/download/).

2. Run `npm ci` (Continuous Integration) to install the exact dependency versions from the lockfile. This requires the `package-lock.json` provided in the starter code.

3. Run `npm run start`.

## Local Deployment: FastAPI server

Prerequisites:

-   Python 3.7
-   pip

1. Create a virtual environment: `python -m venv venv`.

2. Activate the virtual environment: `source venv/bin/activate`.

3. Install dependencies: `pip install -r requirements.txt`.

4. Start the server: `uvicorn main:app --reload`.
