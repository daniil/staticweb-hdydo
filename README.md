> Pro Tip: Download cmder (http://bliker.github.io/cmder/) for better Windows console. Simply extract to a folder. C:/ works well.

Go to divshot.com and signup (use Github for a quick signup)

You will need NodeJS installed to work with Divshot CLI.

Install Divshot CLI by running

`npm install -g divshot-cli`
  
Make sure to run your console as administrator

Login into Divshot by running

`divshot login`

Authorize Divshot in your browser

Create a first app by cloning markie divshot example app and pushing it to your account

```
git clone git://github.com/divshot/markie.git
cd markie
divshot config:add name daniil-markie
divshot push
```

Create a folder on your computer with namespace and app name, such as daniil-hdydo

cd into folder and run

```
divshot init

Name: leave blank
Root: public (to ensure we have a way to store sensitive information in the level above) 
Clean URLs: y
Error Pages: leave blank
Divshot.io app: n
```

Go to firebase.com and signup, the initial app will be created for you automatically.

This is a good time to update our initial shell for the app.

We will use bower for our dependencies, you can install it by running 

`npm install -g bower`

Initialize the bower file by running

`bower init`

and follow prompts (keep everything default and add your own desription and author)

Since we're using public folder for our public content, you will need to create a file named .bowerrc in root folder and add following

```
{
  "directory" : "public/bower_components"
}
``

Let's install Firebase client by running

`bower install firebase --save`

Let's add jQuery for easy DOM manipulation as well.

`bower install jquery --save`

Add both of them in your page's `<head>`

```
<script src="bower_components/firebase/firebase.js"></script>
<script src="bower_components/jquery/dist/jquery.min.js"></script>
```

We will be using Semantic UI for our CSS framework, install it by running

`bower install semantic --save`

Go to your public folder and open `index.html` file that Divshot has created initially for you. Update your title and body and remove gnarly inline CSS. Add Semantic UI CSS and JS files by adding a link and script elements into your page's `<head>`

```
<link rel="stylesheet" href="bower_components/semantic/dist/semantic.min.css">
<script src="bower_components/semantic/dist/semantic.min.js"></script>
```

To test out our app locally, run

`divshot server`

Next let's add our app's JS and CSS files. I put mine in js/app.js and css/app.css. Add them to your index.html. This demo is not concentrating on CSS, so feel free to grab mine or style app to your liking.

This time I'm adding app.js before the </body> tag. Let's put everything in jQuery closure.

```
$(function() {

});
```

Next we need to add a reference to the root of your Firebase, using the URL Firebase created for you during the signup process, mine looking like: 

`var fbDataRef = new Firebase('https://shining-torch-5166.firebaseio.com/');`

Let's add HTML for our input fields and chat container:

```
<div class="ui form">
  <div class="fields">
    <div class="four wide field">
      <label>Author</label>
      <input id="author" type="text" name="author" placeholder="Author">
    </div>
    <div class="twelve wide field">
      <label>Message</label>
      <div class="ui fluid action input">
        <input id="message" type="text" name="message" placeholder="Message">
        <div id="btn-message-send" class="ui blue button">Send</div>
      </div>
    </div>
  </div>
</div>
<div class="ui segment">
  <div class="ui ribbon label">Chat</div>
  <div id="chat-container" class="chat-container"></div>
</div>
```

Now we're ready to start creating the messages for out chat, first we need to enable the message sending functionality

```
$('#message').on('keypress', function(e) {
  if (e.keyCode === 13) {
    postChatMessage();
  }
});

$('#btn-message-send').on('click', function(e) {
  e.preventDefault();
  postChatMessage();
});

function postChatMessage() {
  var author = $('#author').val();
  var message = $('#message').val();

  fbDataRef.push({
    author: author, 
    message: message
  });

  $('#message').val('');
}
```

We're using Firebase helper function that makes creating lists easier. We can also use 'set' method for strings or plain JS objects like so:

```
fbDataRef.set('Author ' + author + ' says ' + message);
fbDataRef.set({author: author, message: message});
```

In order to display our chat messages we need to add an event notifying us when new chat messages arrive. It takes an event type and callback function as it's arguments. For each message in Firebase, it will call our callback with a snapshot containing data, which we can extract using val() function:

```
fbDataRef.on('child_added', function(snapshot) {
  var chatMsg = snapshot.val();
  displayChatMessage(chatMsg.author, chatMsg.message);
});
```

Display chat message function:

```
function displayChatMessage(author, message) {
  $('<p/>').text(message).prepend($('<strong/>').text(author + ': ')).appendTo($('#chat-container'));
  $('#chat-container')[0].scrollTop = $('#chat-container')[0].scrollHeight;
};
```

Our app is now rather rudimentary but functional, let's push it to Divshot to test that everything's working in deployment. Run

`divshot push`

By default Divshot pushes an app to development environment. There are 3 environments: development, staging and production. While you can push to any out of three of them using 'divshot push production', a better way is to use 'promote' command. Pushing to development and staging is acceptable, but it's best practice to run `divshot promote development production` for when you're ready for production. 

Test your app by going to URL Divshot CLI gives you after deployment, for me it's http://development.daniil-hdydo.divshot.io/

Before we add more messaging functionality to our app, let's make sure that we have user authentication, so you don't have to enter your author name every time you refresh the page.

In Firebase Dashboard go to 'Login & Auth' tab and enable 'Email & Password' Authentication. After that first thing we'll do in our app is check whether user is authorized when he opens our app:

`var authData = fbDataRef.getAuth();`

Since we haven't added any login or registration code just yet, this should return 'null'. We'll use that to give user a way to register or login. Add id="chat-controls" to your Author and Message ui.form so we can access it via jQuery. Add a login/register container above it:

```
<div id="auth-container" class="auth-container">
  <div class="ui attached warning message">
    <div class="header">
      You must login to be able to post chat messages.
    </div>
    <p>
      To register account, make sure the "New User" toggle is on.
    </p>
  </div>
  <form class="ui form attached fluid segment">
    <div class="four fields">
      <div class="field">
        <input id="auth-email" type="text" placeholder="Email">
      </div>
      <div class="field">
        <input id="auth-password" type="password" placeholder="Password">
      </div>
      <div class="field">
        <div class="ui toggle checkbox input-aligned">
          <input id="auth-new-user" type="checkbox">
          <label>New User</label>
        </div>
      </div>
      <div class="field">
        <button id="btn-auth-submit" type="submit" class="ui blue submit button">Submit</div>
      </div>
    </div>
  </form>
</div>
```

Next we'll add our registration and login logic:

```
if (authData) {
  $('#auth-container').hide();
  $('#chat-controls').show();
} else {
  $('#auth-container').show();
  $('.ui.checkbox').checkbox();
  $('#chat-controls').hide();

  $('#btn-auth-submit').on('click', function(e) {
    var isNewUser = ($('#auth-new-user').parent().hasClass('checked')),
        email = $('#auth-email').val(),
        password = $('#auth-password').val();

    if (isNewUser) {
      fbDataRef.createUser({
        email    : email,
        password : password
      }, function(error) {
        if (error === null) {
          console.log("User created successfully");
          loginUser(email, password);
        } else {
          console.log("Error creating user:", error);
        }
      });
    } else {
      loginUser(email, password);
    }
  });

  function loginUser(email, password) {
    fbDataRef.authWithPassword({
      email    : email,
      password : password
    }, function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
        $('#auth-container').hide();
        $('#chat-controls').show();
      }
    });
  }
}
```

Now that we have authentication for users there is no need to specify your author name when posting a message, update the author section with
```
<div class="four wide field">
  <label>Author</label>
  <div id="author-label" class="ui image big label">
    <span class="author-label-email"></span>
    <a id="author-logout" class="detail">Logout</a>
  </div>
  <input id="author" type="hidden" name="author">
</div>
```

And add event for when user is authenticated as well as logging out functionality:
```
fbDataRef.onAuth(function(authData) {
  if (authData) {
    $('#author-label').find('.author-label-email').text(authData.password.email);
    $('#author').val(authData.password.email);
  }
});

$('#author-logout').on('click', function() {
  fbDataRef.unauth();
  location.reload();
});
```

This is a good time to check that everything is working as intended when we publish to Divshot:

`divshot push`

Next we will add drawing capabilities. Our reference will need to store two sets of data now - messages and drawing points. Because Firebase is a NoSQL data storage it's easy to change our schema. It might be a good idea to delete all data you have in Firebase so we can change the structure going forward. To store our messages in a separate object, we need to store and retrieve them on a child of reference object, let's call it 'messages':
`fbDataRef.on('child_added' ...`
becomes
`fbDataRef.child('messages').on('child_added' ...`
and 
`fbDataRef.push({ author: author ...`
becomes
`fbDataRef.child('messages').push({ author: author ...`

Next we'll add canvas to draw on, so let's update our chat section to include the canvas:

```
<div class="ui grid">
  <div class="row">
    <div class="ten wide column">
      <div class="ui segment">
        <div class="ui ribbon label">Chat</div>
        <div id="chat-container" class="chat-container"></div>
      </div>
    </div>
    <div class="six wide column">
      <div class="ui segment">
        <div class="ui ribbon label">Whiteboard</div>
        <div id="canvas-label-clear" class="ui bottom right attached big red label">
          <a id="btn-canvas-clear">Clear</a>
        </div>
        <canvas id="drawing-canvas" class="drawing-canvas"></canvas>
      </div>
    </div>
  </div>
</div>
```

And code for resizing canvas to fit the dimensions:

```
var $canvasEl = $('#drawing-canvas');
$(window).on('resize', function() {
  $canvasEl.attr('width', $canvasEl.parent().innerWidth() - 32);
  $canvasEl.attr('height', $canvasEl.width());
}).trigger('resize');
```

Lastly, we will add drawing and canvas clearing functionality, keeping in mind that unauthorized users can't draw on whiteboard:

```
var canvasContext = $canvasEl[0].getContext('2d');
var pixSize = 4;
var lastPoint = null;
var currentColor = '000';
var mouseIsDown = 0;

$canvasEl.on('mousedown', function() { mouseIsDown = 1; });

$canvasEl.on('mouseout mouseup', function() {
  mouseIsDown = 0; 
  lastPoint = null;
});

$canvasEl.on('mousedown mousemove', drawLineOnMouseMove);

fbDataRef.child('drawingPoints').on('child_added', drawPixel);
fbDataRef.child('drawingPoints').on('child_changed', drawPixel);
fbDataRef.child('drawingPoints').on('child_removed', clearPixel);

$('#btn-canvas-clear').on('click', function() {
  fbDataRef.child('drawingPoints').remove();
});

function drawLineOnMouseMove(e) {
  if (!mouseIsDown || !authData) return;

  e.preventDefault();

  var offset = $canvasEl.offset();
  var x1 = Math.floor((e.pageX - offset.left) / pixSize - 1),
      y1 = Math.floor((e.pageY - offset.top) / pixSize - 1);
  var x0 = (lastPoint == null) ? x1 : lastPoint[0];
  var y0 = (lastPoint == null) ? y1 : lastPoint[1];
  var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  var sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1, err = dx - dy;
  while (true) {
    fbDataRef.child('drawingPoints')
             .child(x0 + ":" + y0)
             .set(currentColor === "fff" ? null : currentColor);

    if (x0 == x1 && y0 == y1) break;
    var e2 = 2 * err;
    if (e2 > -dy) {
      err = err - dy;
      x0 = x0 + sx;
    }
    if (e2 < dx) {
      err = err + dx;
      y0 = y0 + sy;
    }
  }
  lastPoint = [x1, y1];
};

function drawPixel(snapshot) {
  var coords = snapshot.key().split(":");
  canvasContext.fillStyle = "#" + snapshot.val();
  canvasContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
};

function clearPixel(snapshot) {
  var coords = snapshot.key().split(":");
  canvasContext.clearRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
};
```

We also can not allow unauthorized users to clear the whiteboard, so since we're adding yet another UI manipulation, it's a good time to refactor it into a separate function and call it within our fbDataRef.onAuth callback (make sure to also refactor it everywhere in initial getAuth()):

```
function updateUI(authPayload) {
  authData = authPayload;

  if (authPayload) {
    $('#auth-container').hide();
    $('#chat-controls').show();
    $('#canvas-label-clear').show();
  } else {
    $('#auth-container').show();
    $('.ui.checkbox').checkbox();
    $('#chat-controls').hide();
    $('#canvas-label-clear').hide();
  }
}

fbDataRef.onAuth(function(authData) {
  ...
  updateUI(authData);
});
```

As a last bit of functionality for our drawing app, let's add some colors, first creating controls for it:

```
<div id="canvas-label-colors" class="ui bottom left attached big label">
  <div class="ui black empty circular label"></div>
  <div class="ui yellow empty circular label"></div>
  <div class="ui green empty circular label"></div>
  <div class="ui blue empty circular label"></div>
  <div class="ui orange empty circular label"></div>
  <div class="ui purple empty circular label"></div>
  <div class="ui red empty circular label"></div>
  <div class="ui teal empty circular label"></div>
  <div id="canvas-label-current-color" class="floating ui circular mini label canvas-label-current-color"></div>
</div>
```

And then functionality for switching the color:

```
$('#canvas-label-colors').find('.circular.label').on('click', function(e) {
  currentColor = rgbToHex($(e.target).css('background-color'));
  $('#canvas-label-current-color').css('background-color', '#' + currentColor);
});
```

jQuery returns background color in rgb format, so you will need a utility converting function:

```
function rgbToHex(val) {
  var parts = val.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  delete(parts[0]);
  for (var i = 1; i <= 3; ++i) {
      parts[i] = parseInt(parts[i]).toString(16);
      if (parts[i].length == 1) parts[i] = '0' + parts[i];
  }

  return parts.join('');
}
```

Lastly, we don't want any unauthorized users picking colors even though they can't draw so make sure you add the toggle in your updateUI() method.

Now is a good checkpoint for testing latest changes on Divshot, let's push it to development environment:

`divshot push`

Next step would be to create a list of users currently online, as well as showing the status of their connection. Firebase makes it easy by providing us with a way to detect connection state as well as an event for when the user disconnects, `onDisconnect`, which allows us to do a proper cleanup when user disconnects or crashes.

We only want to consider user connected when she actually logs in, so we create a reference to a user connection as well as make a record of that user status on authentication and make sure we remove her when she disconnects. We get onDisconnect event when user logs out for free since reload would disconnect a user and after log out we refresh the page:

```
var userConnection;

fbDataRef.onAuth(function(authData) {
  if (authData) {
    console.log('User has connected:', authData);

    userConnection = fbDataRef.child('connectedUsers').push({
      'uid': authData.uid,
      'name': authData.password.email, 
      'status': 'online'
    });

    userConnection.onDisconnect().remove();
  }
});

```

To display our list of users, let's change our markup a little bit to fit more columns, making it look like following:

```
<div class="three wide column">
  <div class="ui segment">
    <div class="ui ribbon label">Users Online</div>
    <div id="users-container" class="users-container"></div>
  </div>
</div>
<div class="eight wide column">
  <div class="ui segment">
    <div class="ui ribbon label">Chat</div>
    ...
<div class="five wide column">
  <div class="ui segment">
    <div class="ui ribbon label">Whiteboard</div>
    ...
```

And add our events for when users connect/disconnect:

```
fbDataRef.child('connectedUsers').on('child_added', function(snapshot) {
  $('#users-container').append('<p data-user-id="' + snapshot.val().uid + '"><i class="lightning green icon"></i><a class="username">' + snapshot.val().name + '</a></p>');
});

fbDataRef.child('connectedUsers').on('child_removed', function(snapshot) {
  $('#users-container').children('[data-user-id="' + snapshot.val().uid + '"]').remove();
});
```

We will use idle.js library to add user connection status information, install it by running `bower install idle.js --save` and make sure to add it to your index.html in your </head> section.

Then we'll use idle.js for checking user status and 'child_changed' Firebase event for updating the appropriate user:

```
fbDataRef.child('connectedUsers').on('child_changed', function(snapshot) {
  var statusIcon;

  switch (snapshot.val().status) {
    case 'online':
      statusIcon = 'lightning green';
      break;
    case 'idle':
      statusIcon = 'hide yellow';
      break;
    case 'away':
      statusIcon = 'ban red';
      break;
  }

  $('#users-container').children('[data-user-id="' + snapshot.val().uid + '"]')
                       .find('.icon')
                       .removeClass()
                       .addClass(statusIcon + ' icon');
});

var idleCallback = function() {
  userConnection && userConnection.update({
    'status': 'idle'
  });
};

var awayCallback = function() {
  userConnection && userConnection.update({
    'status': 'away'
  });
};

var backCallback = function() {
  userConnection && userConnection.update({
    'status': 'online'
  });
};

var idle = new Idle({
  onHidden : idleCallback,
  onAway : awayCallback,
  onVisible : backCallback,
  onAwayBack : backCallback,
  awayTimeout : 60000
});

idle.start();
```

Let's test out this new functionality on Divshot:

`divshot push`

Next we will add a video chat functionality. We will be using easyRTC for our WebRTC toolkit. For the purpose of this demo, using the pre-existing instance should be sufficient but in case you want to have your own instance of easyRTC running you will need to deploy it to Heroku for server-side components. First create a Heroku account, clone 'https://github.com/mohitathwani/herokuRTC' into a folder and run

```
heroku login
heroku create
```

Before we push our code, let's make sure that CORS is enabled so we can access this from a different domain:

```
httpApp.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
```

Now we can push our modified app to Heroku:

```
git push heroku master
heroku open
```

On client side make sure to include socket.io and easyRTC scripts, referencing the Heroku URL you got or just using my instance:

```
<script src="https://arcane-cove-6754.herokuapp.com/socket.io/socket.io.js"></script>
<script src="https://arcane-cove-6754.herokuapp.com/easyrtc/easyrtc.js"></script>
```

Next, we'll add a call button for every logged in user, first adding an identifying class to user status icon:

```
$('#users-container').append('<p data-user-id="' + snapshot.val().uid + '"><i class="lightning green icon status"></i><a class="username">' + snapshot.val().name + '</a></p>');
```

Which also requires a little change to our user status icon updating code:

```
$('#users-container').children('[data-user-id="' + snapshot.val().uid + '"]')
                     .find('.icon.status')
                     .removeClass()
                     .addClass(statusIcon + ' icon status');
```

We'll add markup for our video chat modal dialog:

```
<div id="video-chat-modal" class="ui modal video-chat-modal">
  <i class="close icon"></i>
  <div class="header">
    Video chat
  </div>
  <div class="content">
    <div class="description">
      <div id="videos"> 
        <video autoplay="autoplay" id="self-video" muted="muted" volume="0" ></video>
        <video autoplay="autoplay" id="caller-video"></video>
      </div>
    </div>
  </div>
  <div class="actions">
    <div class="ui negative right labeled icon button">
      Hang up
      <i class="call square red icon"></i>
    </div>
  </div>
</div>
```

Next step is to initialize easyRTC library and update userConnection with easyRTC id if they successfully connected to easyRTC instance. We will need this id to make calls to other users, as well as create buttons for the user list. The URL is your Heroku easyRTC instance or you can use the current one to use my instance:

```
var userUid;

fbDataRef.onAuth(function(authData) {
  if (authData) {
    userUid = authData.uid;
    easyRTC.setSocketUrl('https://arcane-cove-6754.herokuapp.com');
    easyRTC.initManaged("audioVideo", "self-video", ["caller-video"], loginSuccess);
  }
});

function loginSuccess(easyRTCId) {
  console.log('easyRTC login success: ' + easyRTCId);

  userConnection && userConnection.update({
    'easyRTCId': easyRTC.cleanId(easyRTCId)
  });
}
```

Whenever the connectedUsers child is updated, we create a button to call that user with easyRTC id stored. We also make sure that we only add buttons to other users, since we can't technically call ourselves:

```
fbDataRef.child('connectedUsers').on('child_changed', function(snapshot) {
  var $userEl = $('#users-container').children('[data-user-id="' + snapshot.val().uid + '"]');

  if (userUid !== snapshot.val().uid && !$userEl.find('.call-button').data('easyrtc-id') && snapshot.val().easyRTCId && snapshot.val().easyRTCId !== 'undefined') {
    $userEl.append('<span class="circular ui mini green icon button call-button" data-easyrtc-id="' + snapshot.val().easyRTCId + '"><i class="icon call"></i></span>');
  }
});
```

Next we will add an event for making a call when the call button is clicked using easyRTC.call() method. We open up our modal dialog, make sure that our mirror video is playing and send the call request to the easyRTC id:

```
$('body').on('click', '.call-button', function(e) {
  console.log('Call initiated to: ', $(e.target).closest('.call-button').data('easyrtc-id'));

  $('#video-chat-modal').modal('show');

  performCall($(e.target).closest('.call-button').data('easyrtc-id'));

  $('#self-video')[0].play();
});

function performCall(otherEasyrtcid) {
  easyRTC.hangupAll();
  var acceptedCB = function(accepted, caller) {
    if (!accepted) {
      easyRTC.showError("CALL-REJECTED", "Sorry, your call to " + easyRTC.idToName(caller) + " was rejected");
    }
  }
  var successCB = function() {};
  var failureCB = function() {};
  easyRTC.call(otherEasyrtcid, successCB, failureCB, acceptedCB);
}
```

By default all call requests are accepted automatically, so all we need to do now to open dialog for a calee is to attach a video play event:

```
$('#caller-video').on('play', function() {
  $('#video-chat-modal').modal('show');
  $('#caller-video')[0].play();
  $('#self-video')[0].play();
});
```

Lastly we make sure to hangup all calls if one of the parties closed their video modal:

```
$('#video-chat-modal').find('.negative.button').on('click', function(e) {
  easyRTC.hangupAll();
});
```
