import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;

public class HTTPClient {

    public static void main(String[] args) {

        try {
            Socket socket = new Socket("localhost", 8080);

            // Send HTTP GET request
            PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
            out.println("GET / HTTP/1.1");
            out.println("Host: localhost");
            out.println("Connection: close");
            out.println();

            // Read response
            BufferedReader in = new BufferedReader(
                    new InputStreamReader(socket.getInputStream()));

            // Write HTML to file
            BufferedWriter file = new BufferedWriter(
                    new FileWriter("download_page.html"));

            String line;
            boolean body = false;

            System.out.println("Downloaded Web Page:\n");

            while ((line = in.readLine()) != null) {

                if (body) {
                    file.write(line);
                    file.newLine();
                    System.out.println(line);
                }

                // Blank line separates headers from body
                if (line.isEmpty()) {
                    body = true;
                }
            }

            file.close();
            in.close();
            out.close();
            socket.close();

            System.out.println("\nWeb page saved as download_page.html");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}