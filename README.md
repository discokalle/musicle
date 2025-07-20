# Musicle

(The website is not hosted anywhere as non-free features that were used for the back-end have expired. However, there is a [screencast](https://youtu.be/D5uOKUn5cbo) of the app which displays the key functionality.)

This project was done as part of the course [TDDD27 Advanced Web Programming](https://www.ida.liu.se/~TDDD27/).

## Project Description

### Functional

- A social music app
- Users can connect their Spotify accounts to get a tailored experience
  - Their profile will contain a summary of different statistics about their listening habits
- Intended for use in in-person get-togethers (but should work well in a remote settings as well)
  - Music quizzes that take each person's music taste into account (by looking at their Spotify data)
  - A live queue for music-listening sessions with a rank-voting mechanism
    - The song in queue with the most votes will be played next on the connected Spotify device

### Technological

- Client framework (front-end): React (w/ Tailwind)
- Server framework (back-end): Firebase
  - Realtime Database
  - Authentication
  - Functions
  - Storage
