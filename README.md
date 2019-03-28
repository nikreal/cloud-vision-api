# 1. Project Started From Here
<a href="https://firebase.google.com/docs/functions/get-started">Get started: write and deploy your first functions</a>

```console
$ npm install -g firebase-tools
$ firebase login

$ firebase init
```

<b>? Select a default Firebase project for this directory:</b><br>
profile-final-test (Profile-FINAL-TEST)

<b>? What language would you like to use to write Cloud Functions?</b><br>
Javascript

<b>? Do you want to use ESLint to catch probable bugs and enforce style? (y/N)</b> y<br>

<b>? Do you want to install dependencies with npm now? (Y/n)</b> y<br>
<br>

# 2. Cofiguration
1. Change `ecmaVersion` to 8 from 6 in `functions/.eslintrc.json` line 4.
2. Add node engine in `package.json`
```json
"engines": {
  "node": "8"
},
```

### Follow this tutorial
<a href="https://codelabs.developers.google.com/codelabs/firebase-cloud-functions/#8">9. Images moderation</a>

Add a following code in `function/index.js` at line 37.

```js
return null;
```

# 3. Deploy
```
$ firebase deploy --only functions
```

# 4. Test
Go to the Firebase Console `Storage` tab and upload an image that contains adult or violent content. After a short time the image will be replaced by a blurred version of itself.<br>
You can check with this image <a href="https://pixabay.com/zombie-flesh-eater-dead-spooky-949916/">flesh eating Zombie</a>