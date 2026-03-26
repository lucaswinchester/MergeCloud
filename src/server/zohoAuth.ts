import axios from 'axios';

const clientId = process.env.ZOHO_CLIENT_ID;
const clientSecret = process.env.ZOHO_CLIENT_SECRET;

export async function getTokens(grantToken: string) {
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

    } catch (error: unknown) {
        const err = error as Record<string, unknown>;
        const errResponse = err.response as Record<string, unknown> | undefined;
        const errMessage = err.message as string | undefined;
        console.error('Error fetching tokens:', errResponse?.data || errMessage);
    }
}

/**
 * Refresh an expired access token using the refresh token.
 */
export async function refreshAccessToken() {
    const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;

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
    } catch (error: unknown) {
        const err = error as Record<string, unknown>;
        const errResponse = err.response as Record<string, unknown> | undefined;
        const errMessage = err.message as string | undefined;
        console.error('Error refreshing access token:', errResponse?.data || errMessage);
    }
}