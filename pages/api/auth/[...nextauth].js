import NextAuth from "next-auth"
import TwitchProvider from "next-auth/providers/twitch"
import axios from 'axios'

const refreshTwitchAccessToken = async (accessToken, refreshToken) => {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });
    console.log(`Got another access token`);
    return response.data;
}


export default NextAuth({
    // Configure one or more authentication providers
    providers: [
        TwitchProvider({
            clientId: process.env.TWITCH_CLIENT_ID,
            clientSecret: process.env.TWITCH_CLIENT_SECRET,
            wellKnown: "https://id.twitch.tv/oauth2/.well-known/openid-configuration",
            authorization: {
                url: "https://id.twitch.tv/oauth2/.well-known/openid-configuration",
                params: {
                    scope: "openid user:read:email clips:edit",
                },
            },
            redirectUri: 'https://id.twitch.tv/oauth2/.well-known/openid-configuration',
        }),
        // ...add more providers here
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Persist the OAuth access_token to the token right after signin
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
            }
            return token
        },
        async session({ session, token }) {
            // Send properties to the client, like an access_token from a provider.
            // session.accessToken = token.accessToken
            // session.refreshToken = token.refreshToken
            let newToken = await refreshTwitchAccessToken(token.accessToken, token.refreshToken);
            session.accessToken = newToken.access_token;
            session.refreshToken = newToken.refresh_token;

            return session
        }
    }
})