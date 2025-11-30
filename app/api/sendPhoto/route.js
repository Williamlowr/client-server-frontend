export const runtime = "nodejs";
import net from "net";

export async function POST(req) {
  try {
    const { fileBase64 } = await req.json();
    // Validate input
    if (!fileBase64) {
      return new Response(
        JSON.stringify({ error: "Missing fileBase64" }),
        { status: 400 }
      );
    }

    // Decode base64 to buffer
    const fileBuffer = Buffer.from(fileBase64, "base64");

    // Communicate with TCP server
    return await new Promise((resolve) => {
      const client = new net.Socket();
      let serverResponse = "";
      let resolved = false;

      // Set timeout for connection
      const timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        client.destroy();
        resolve(
          new Response(
            JSON.stringify({
              status: "error",
              message: "Connection timeout",
            }),
            { status: 500 }
          )
        );
      }, 10000);

      // Connect to TCP server (Railway)
      client.connect(33250, "trolley.proxy.rlwy.net", () => {
        // Send file size and data
        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeInt32BE(fileBuffer.length);
        client.write(sizeBuffer);
        client.write(fileBuffer);
      });

      // Collect data from server
      client.on("data", (data) => {
        serverResponse += data.toString();
      });

      // Handle connection close
      client.on("close", () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        if (!serverResponse.trim()) {
          resolve(
            new Response(
              JSON.stringify({
                status: "error",
                message: "Empty server response",
              }),
              { status: 500 }
            )
          );
          return;
        }

        // Parse server response
        try {
          const parsed = JSON.parse(serverResponse.trim());
          resolve(
            new Response(
              JSON.stringify({
                status: "confirmed",
                server: parsed,
              }),
              { status: 200 }
            )
          );
        } catch {
          resolve(
            new Response(
              JSON.stringify({
                status: "error",
                message: "Malformed server response",
                raw: serverResponse,
              }),
              { status: 500 }
            )
          );
        }
      });

      client.on("error", (err) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        resolve(
          new Response(
            JSON.stringify({
              status: "error",
              message: err.message,
            }),
            { status: 500 }
          )
        );
      });
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Internal server error",
      }),
      { status: 500 }
    );
  }
}
