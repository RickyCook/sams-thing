Basic logging of mood over time

## Running
```
docker build -t sams-thing:latest .
docker run -dt -P -n sams-thing sams-thing:latest
docker port sams-thing
```

When you load the UI, you'll need to create/migrate the database:

- Click the cog icon in the top right corner
- Click the "migrate" button
  - Reset will delete the database
  - Rollback will "unmigrate" the database 1 version
