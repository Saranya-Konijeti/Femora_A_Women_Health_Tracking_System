# FEMORA – Women's Health Project

## About the Project

FEMORA is a web application developed as a mini project to bring some useful women's health features into one place. It provides tools for tracking menstrual cycles, getting basic health information, finding nearby hospitals and managing medicine reminders.

The main aim of this project is to make everyday health-related information and basic healthcare tools easily accessible through a simple web application.

## Features

- **User Registration and Login:** Users can create an account and log in to the application.
- **Homepage:** Provides access to all the available features.
- **Period Tracker:** Allows users to enter period dates and view cycle predictions.
- **Health Chatbot:** Answers general women's health questions using the Google Gemini API.
- **Hospital Search:** Helps users find nearby hospitals and gynecologists.
- **Medicine Reminders:** Users can add and delete medicine reminders.
- **Notifications:** Sends medicine reminders through SMS, WhatsApp, or voice calls using Twilio.

*Note: The chatbot is intended only for general health information and does not replace professional medical advice.*

## Technologies Used

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- Google Gemini API
- Twilio
- JSON for local data storage

## Requirements

Install the following before running the project:

- Node.js
- npm
- Google Gemini API key (for chatbot functionality)
- Twilio account and credentials (for sending medicine notifications)

## How to Run the Project

Follow these steps to run FEMORA on your local system.

### Step 1: Download the Project

Download the repository from GitHub as a ZIP file and extract it.

Alternatively, clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

### Step 2: Open the Project Folder

Open the extracted project folder in VS Code.

Open the terminal and navigate to the project directory:

```powershell
cd "MiniProject-Women_Health"
```

### Step 3: Install Dependencies

Run the following command in the terminal:

```bash
npm install
```

This installs all the packages required to run the application.

### Step 4: Configure API Keys

Create the required environment files in the main project folder.

**.env**

```env
GEMINI_API_KEY=your_gemini_api_key
```

**.env.medicine**

```env
PORT=4000
SESSION_SECRET=your_random_secret

TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_NUMBER=your_phone_number
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number
```

Replace the example values with your actual credentials.

These files should remain private and must not be uploaded to GitHub.

### Step 5: Start the Application

After installing the dependencies and configuring the environment files, run:

```bash
npm start
```

This starts the main server (`remainders_server.js`). The server also loads the chatbot route from `bot1.js`, so there is no need to run it separately.

### Step 6: Open the Website

After running `npm start`, wait until the server starts successfully.

Open your browser and enter the following URL:

**http://localhost:4000/Login.html**

The login page will open. Register a new account if you are using the application for the first time. After logging in, you will be redirected to the homepage, where you can access the different features.

Keep the terminal running while using the application.

To stop the application, press `Ctrl + C` in the terminal.

## Project Structure

| File Name | Description |
|---|---|
| `remainders_server.js` | Main server for the application, authentication and reminder functionality. |
| `bot1.js` | Backend code for the health chatbot. |
| `bot2.js` | Frontend chatbot functionality. |
| `Homepage.html` | Main homepage. |
| `Login.html` | Login page. |
| `Register.html` | Registration page. |
| `calender.html` | Period tracking page. |
| `bot.html` | Health chatbot page. |
| `maps.html` | Hospital and gynecologist search page. |
| `remainders.html` | Medicine reminder page. |
| `assets/` | Images, videos and other static files, if included. |
| `package.json` | Contains project dependencies and scripts. |

## Troubleshooting

**1. Chatbot is not responding**

- Check whether the Gemini API key is configured correctly in `.env`.
- Make sure the server is running.
- Restart the application after changing the API key.

**2. Login or reminder pages are not opening**

- Make sure you are logged in.
- Open the application through `http://localhost:4000` instead of directly opening HTML files.

**3. Medicine notifications are not working**

- Check the Twilio account credentials.
- Verify the sender phone number and WhatsApp configuration.
- Make sure the Twilio account supports the selected notification method.

**4. Port 4000 is already in use**

- Stop the previously running server using `Ctrl + C`.
- Start the application again using `npm start`.

## Security Notes

- Do not upload API keys or Twilio credentials to GitHub.
- Keep `.env` and `.env.medicine` private.
- Do not upload personal user information or reminder data.
- The application currently uses JSON files for storing account and reminder information. It is designed for local development and has not been configured for production deployment.

## Author

Developed as a Women's Health Mini Project.

