require('dotenv').config();

const express = require('express');
const session = require('express-session');
const request = require('request-promise');

const app = express();
app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: true
}))

app.get('/', (req, res)=>{
    res.redirect('/login');
})

app.get('/login', (req, res) => {
    const authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  
    const queryParams = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      redirect_uri: process.env.REDIRECT_URI,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://mail.google.com/'
    })
  
    const authUrl = `${authEndpoint}?${queryParams}`
    res.redirect(authUrl)
})

app.get('/callback', async (req, res) => {
    console.log("callback");
    const tokenEndpoint = 'https://oauth2.googleapis.com/token'
  
    const { code } = req.query
  
    const requestBody = {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI
    }
  
    const options = {
        method: 'POST',
        uri: tokenEndpoint,
        form: requestBody,
        json: true
    }
  
    try {
        const response = await request(options)
    
        req.session.accessToken = response.access_token
        req.session.refreshToken = response.refresh_token
    
        res.redirect('/user')
  
    } catch (err) {
        res.send(err);
    }
})

app.get('/user', async (req, res) => {
    console.log("user");
    const userEndpoint1 = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json'
    const userEndpoint2 = 'https://gmail.googleapis.com/gmail/v1/users/me/profile'
    
    const options = {
        headers: {
        Authorization: `Bearer ${req.session.accessToken}`
        },
        json: true
    }
    
    try {
        const response1 = await request.get(userEndpoint1, options)
        const response2 = await request.get(userEndpoint2, options)
        const mergedJSON = Object.assign({}, response1, response2);
        res.send(mergedJSON);
    } catch (err) {
        res.send(err)
    }
    
})

app.listen(8080, ()=>{
    console.log('Server running at port 8080');
})