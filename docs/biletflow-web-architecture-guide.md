# BiletFlow web architecture

**Screen → View model → Repository → Service**

- **Screen** displays state and forwards user actions.
- **View model** handles those actions and prepares what the screen needs to show.
- **Repository** is the app’s source of truth for a kind of data. It calls services and owns decisions about storing, caching, and refreshing that data.
- **Service** talks to the backend or browser storage. It handles requests and responses.

**Example.** The sign-in view model calls the session repository. The repository uses the API service to sign in and load the account, then saves the token and updates the session.

Use TanStack Query for server data. Define what to load and when to refresh it in the repository. Use the view model to decide what the screen shows while it loads.

[Flutter’s guide to app architecture](https://docs.flutter.dev/app-architecture/guide)
