$(function() {
  var fbDataRef = new Firebase('https://shining-torch-5166.firebaseio.com/');
  var authData = fbDataRef.getAuth();

  /*
   * Authentication
   */
  if (!authData) {
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
        }
      });
    }
  }

  fbDataRef.onAuth(function(authData) {
    if (authData) {
      $('#author-label').find('.author-label-email').text(authData.password.email);
      $('#author').val(authData.password.email);
    }

    updateUI(authData);
  });

  $('#author-logout').on('click', function() {
    fbDataRef.unauth();
    location.reload();
  });

  function updateUI(authPayload) {
    authData = authPayload;

    if (authPayload) {
      $('#auth-container').hide();
      $('#chat-controls').show();
      $("#canvas-label-colors").show();
      $('#canvas-label-clear').show();
    } else {
      $('#auth-container').show();
      $('.ui.checkbox').checkbox();
      $('#chat-controls').hide();
      $("#canvas-label-colors").hide();
      $('#canvas-label-clear').hide();
    }
  }


  /*
   * Message posting to chat
   */
  $('#message').on('keypress', function(e) {
    if (e.keyCode === 13) {
      postChatMessage();
    }
  });

  $('#btn-message-send').on('click', function(e) {
    e.preventDefault();
    postChatMessage();
  });

  fbDataRef.child('messages').on('child_added', function(snapshot) {
    var chatMsg = snapshot.val();
    displayChatMessage(chatMsg.author, chatMsg.message);
  });

  function postChatMessage() {
    var author = $('#author').val();
    var message = $('#message').val();
    
    fbDataRef.child('messages').push({
      author: author, 
      message: message
    });

    $('#message').val('');
  }

  function displayChatMessage(author, message) {
    $('<p/>').text(message).prepend($('<strong/>').text(author + ': ')).appendTo($('#chat-container'));
    $('#chat-container')[0].scrollTop = $('#chat-container')[0].scrollHeight;
  };


  /*
   * Whiteboard drawing
   */
  var $canvasEl = $('#drawing-canvas');
  var canvasContext = $canvasEl[0].getContext('2d');
  var pixSize = 4;
  var lastPoint = null;
  var currentColor = '000';
  var mouseIsDown = 0;

  $(window).on('resize', function() {
    $canvasEl.attr('width', $canvasEl.parent().innerWidth() - 32);
    $canvasEl.attr('height', $canvasEl.width());
  }).trigger('resize');

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

  $('#canvas-label-colors').find('.circular.label').on('click', function(e) {
    currentColor = rgbToHex($(e.target).css('background-color'));
    $('#canvas-label-current-color').css('background-color', '#' + currentColor);
  });


  /*
   * Presence functionality
   */
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

  fbDataRef.child('connectedUsers').on('child_added', function(snapshot) {
    $('#users-container').append('<p data-user-id="' + snapshot.val().uid + '"><i class="lightning green icon status"></i><a class="username">' + snapshot.val().name + '</a></p>');
  });

  fbDataRef.child('connectedUsers').on('child_removed', function(snapshot) {
    $('#users-container').children('[data-user-id="' + snapshot.val().uid + '"]').remove();
  });

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
                         .find('.icon.status')
                         .removeClass()
                         .addClass(statusIcon + ' icon status');
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


  /*
   * Video call functionality
   */   
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

  fbDataRef.child('connectedUsers').on('child_changed', function(snapshot) {
    var $userEl = $('#users-container').children('[data-user-id="' + snapshot.val().uid + '"]');

    if (userUid !== snapshot.val().uid && !$userEl.find('.call-button').data('easyrtc-id') && snapshot.val().easyRTCId && snapshot.val().easyRTCId !== 'undefined') {
      $userEl.append('<span class="circular ui mini green icon button call-button" data-easyrtc-id="' + snapshot.val().easyRTCId + '"><i class="icon call"></i></span>');
    }
  });

  $('body').on('click', '.call-button', function(e) {
    console.log('Call initiated to: ', $(e.target).closest('.call-button').data('easyrtc-id'));

    $('#video-chat-modal').modal('show');

    performCall($(e.target).closest('.call-button').data('easyrtc-id'));

    $('#self-video')[0].play();
  });

  $('#caller-video').on('play', function() {
    $('#video-chat-modal').modal('show');
    $('#caller-video')[0].play();
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

  $('#video-chat-modal').find('.negative.button').on('click', function(e) {
    easyRTC.hangupAll();
  });


  /*
   * Utilities
   */
  function rgbToHex(val) {
    var parts = val.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    delete(parts[0]);
    for (var i = 1; i <= 3; ++i) {
        parts[i] = parseInt(parts[i]).toString(16);
        if (parts[i].length == 1) parts[i] = '0' + parts[i];
    }

    return parts.join('');
  }
});