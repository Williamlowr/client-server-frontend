# TCP File Upload Demo (Frontend)

This frontend demonstrates a full end-to-end file integrity verification pipeline using:

- **Next.js**
- **API Routing to Railway Java Server**
- **Raw TCP socket communication**
- **SHA-256 hash integrity validation**

A user selects an image file → the browser computes a SHA-256 hash → the file is sent through an API route → forwarded over raw TCP → processed by a Java server → the server returns its own SHA-256 hash → the frontend compares the two to make sure data transfer was successful.

If the hashes match, the file reached the Java TCP server without corruption.
Made to demonstrate abilities to set up TCP servers and APIs to communicate with my own Java server using a node/next.js frontend.
Please see the related project, client-server-java on my github/portfolio to see the backend code that was compiled into a jar and uploaded to railway.

The API file (app/api/sendPhoto/route.js) is made to interact with Railway and receive the uploaded file's size, hash, and metadata.

Feel free to download the random provided test image (test.jpg) if you feel uncomfortable uploading any personal images, but rest easy knowing the file is just used to calculate file size and hash before being discarded.

---

Note: Server is configured to listen on port 5050