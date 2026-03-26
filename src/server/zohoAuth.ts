import axios from 'axios';
import dotenv from "dotenv"

const API_URL = "https://accounts.zoho.com/oauth/v2/auth?";

const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
const orgId = process.env.ZOHO_ORG_ID;
const clientId = process.env.ZOHO_CLIENT_ID;
const clientSecret = process.env.ZOHO_CLIENT_SECRET;

async function getTokens(grantToken: string) {
    const params = new URLSearchParams();
    params.append('code', grantToken);
    params.append('client_id', clientId as string);
    params.append('client_secret', clientSecret as string);
    params.append('redirect_uri', 'http://www.zoho.com/subscriptions');
    params.append('grant_type', 'authorization_code');

    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
        const { access_token, refresh_token } = response.data;

        console.log('Access Token:', access_token);
        console.log('Refresh Token:', refresh_token);

        // You may want to securely store the refresh token for future use
    } catch (error: any) {
        console.error('Error fetching tokens:', error.response?.data || error.message);
    }
}

/** 
 * Refresh an expired access token using the refresh token.
 */
async function refreshAccessToken() {
    const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN; // Ensure you store this securely

    if (!REFRESH_TOKEN) {
        console.error("Missing refresh token. Store it securely in the .env file.");
        return;
    }

    const params = new URLSearchParams();
    params.append('refresh_token', REFRESH_TOKEN);
    params.append('client_id', clientId as string);
    params.append('client_secret', clientSecret as string);
    params.append('grant_type', 'refresh_token');

    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
        const { access_token } = response.data;

        console.log('New Access Token:', access_token);
        // Update the stored access token securely (e.g., in a database)
    } catch (error: any) {
        console.error('Error refreshing access token:', error.response?.data || error.message);
    }
}