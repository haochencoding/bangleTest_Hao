/* eslint-disable max-statements */
/* eslint-disable max-lines */
/* eslint-disable no-alert */
/* global hello, config */
/* exported connect disconnect online tokenValue sendData getData */

let response;

// ro obtain acceleormeter data Bangle.js check https://banglejs.com/reference#t_l_Bangle_accel
const BANGLE_ACC_CODE = `
Bangle.on('accel',function(a) {
  var d = [
    "A",
    Math.round(a.x*100),
    Math.round(a.y*100),
    Math.round(a.z*100),
    Math.round(a.diff*100),
    Math.round(a.mag*100)
    ];
  Bluetooth.println(d.join(","));
})
`;
//to obtain HRM from Bangle.js check https://banglejs.com/reference#l_Bangle_HRM-raw
const BANGLE_HRM_CODE = `
Bangle.setHRMPower(1)
Bangle.on('HRM-raw', function(hrm){
  var b = [
    "HRM:",
    hrm.raw,
    hrm.filt,
    hrm.bpm,
    hrm.confidence
  ];
  Bluetooth.println(b.join(","))
})
`;

//for HRM display on bangle screen
//Shamelessly copied from https://forum.espruino.com/conversations/367186/
const BANGLE_HRM_DISPLAY = `

Bangle.setLCDPower(1);
Bangle.setLCDTimeout(0);
Bangle.setHRMPower(1);
var hrmInfo, hrmOffset = 0;
var hrmInterval;
var btm = g.getHeight()-1;
        
function onHRM(h) {
  if (counter!==undefined) {
    // the first time we're called remove
    // the countdown
    counter = undefined;
    g.clear();
  }
  hrmInfo = h;
  /* On 2v09 and earlier firmwares the only solution for realtime
  HRM was to look at the 'raw' array that got reported. If you timed
  it right you could grab the data pretty much as soon as it was written.
  In new firmwares, '.raw' is not available. */
  if (hrmInterval) clearInterval(hrmInterval);
  hrmInterval = undefined;
  if (hrmInfo.raw) {
    hrmOffset = 0;
    setTimeout(function() {
      hrmInterval = setInterval(readHRM,41);
    }, 40);
  }
        
  var px = g.getWidth()/2;
  g.setFontAlign(0,0);
  g.clearRect(0,24,239,80);
  g.setFont("6x8").drawString("Confidence "+hrmInfo.confidence+"%", px, 75);
  var str = hrmInfo.bpm;
  g.setFontVector(40).drawString(str,px,45);
  px += g.stringWidth(str)/2;
  g.setFont("6x8");
  g.drawString("BPM",px+15,45);
}
Bangle.on('HRM', onHRM);
/* On newer (2v10) firmwares we can subscribe to get HRM events as they happen */
Bangle.on('HRM-raw', function(v) {
  hrmOffset++;
  if (hrmOffset>g.getWidth()) {
    hrmOffset=0;
    g.clearRect(0,80,239,239);
    g.moveTo(-100,0);
  }
  y = E.clip(btm-v.filt/4,btm-10,btm);
  g.setColor(1,0,0).fillRect(hrmOffset,btm, hrmOffset, y);
  y = E.clip(170 - (v.raw/2),80,btm);
  g.setColor(g.theme.fg).lineTo(hrmOffset, y);
  if (counter !==undefined) {
    counter = undefined;
    g.clear();
  }
});
// It takes 5 secs for us to get the first HRM event
var counter = 5;
function countDown() {
  if (counter) {
    g.drawString(counter--,g.getWidth()/2,g.getHeight()/2, true);
    setTimeout(countDown, 1000);
  }
}
g.clear().setFont("6x8",2).setFontAlign(0,0);
g.drawString("Please wait...",g.getWidth()/2,g.getHeight()/2 - 16);
countDown();
var wasHigh = 0, wasLow = 0;
var lastHigh = getTime();
var hrmList = [];
var hrmInfo;

function readHRM() {
  if (!hrmInfo) return;
  if (hrmOffset==0) {
    g.clearRect(0,100,239,239);
    g.moveTo(-100,0);
  }
for (var i=0;i<2;i++) {
  var hrmData = hrmInfo.raw[hrmOffset];
  hrmOffset++;
  y = E.clip(170 - (hrmData*2),100,230);
  g.setColor(g.theme.fg).lineTo(hrmOffset, y);
  var print = ["HRM", hrmData ];
    Bluetooth.println(
      print.join(",")
      );
}
}
`;

/*
Functions to explore
Bangle.on('faceUp', function(up) { ... }); cheks if the watch is moved or not

Bangle.getHealthStatus('range')

Bangle.on('HRM', function(hrm){
  var b = [
    "HRM",
    Math.round(hrm.bpm*100),
    Math.round(hrm.confidence*100),
    Math.round(hrm.raw*100)
  ];
  Bluetooth.println(b.join(","))
})

*/

// When we click the bangle connect button...
var connection;
document.getElementById('btConnect').addEventListener('click', function() {
  // disconnect if connected already
  if (connection) {
    connection.close(); console.log('TIME STAMP to connect');
    sendData('sessionEnd');
    connection = undefined;
  }
  // Connect
  Puck.connect(function(c) {
    if (!c) {
      alert('Couldn\'t connect!');

      return;
    }
    connection = c;
    // Handle the data we get back, and call 'onLine'
    // whenever we get a line
    let buf = '';
    connection.on('data', function(d) {
      buf += d;
      const l = buf.split('\n');
      buf = l.pop();
      l.forEach(btOnline);
    });
    // First, reset the Bangle
    connection.write('reset();\n', function() {
      // Wait for it to reset itself
      setTimeout(function() {
        // Now upload our code to it
        connection.write('\x03\x10if(1){'+BANGLE_ACC_CODE+BANGLE_HRM_CODE+BANGLE_HRM_DISPLAY+'}\n',
          function() {
            console.log('Ready...');
            console.log('TIME STAMP to connect');
            sendData('sessionBegin');
          });
      }, 1500);
    });
  });
});

// When we get a line of data, check it and if it's
// from the accelerometer, update it
const btOnline = (line) => {
  console.log('RECEIVED:'+line);

  /*const d = line.split(',');
  if (d.length==5 && d[0]=='A') {
    // we have an accelerometer reading
    const accel = {
      x : parseInt(d[1]),
      y : parseInt(d[2]),
      z : parseInt(d[3]),
      diff: parseInt(d[4]),
      mag: parseInt(d[5])
    };*/
};


const displayConnected = () => {
  document.querySelector('#message').classList.add('connected');
  document.querySelector('.avatar').classList.add('connected');
};

const displayDisconnected = () => {
  document.querySelector('.avatar').classList.remove('connected');
};

const connect = () => {
  hello('connect').login()
    .then((res) => {
      response = res;
      console.log(response);
      displayConnected();
    });
};

const disconnect = () => {
  hello('connect').logout()
    .then(() => {
      location.href = '/';
    }, (err) => {
      console.log(err);
      alert('You did not sign in :-)');
    });
};

const online = (session) => {
  const currentTime = (new Date()).getTime() / 1000;

  return session && session.access_token && session.expires > currentTime;
};

const connectURL = 'https://connect-project.io';


const userId = (accessToken) => {

  const testGet = new XMLHttpRequest();
  testGet.open('GET', `${connectURL}/oauth/user`);
  testGet.setRequestHeader('Authorization', `Bearer ${accessToken}`);
  testGet.onreadystatechange = function () {
    if (testGet.readyState === 4) {
      console.log(testGet.status);
      console.log(testGet.responseText);
    }
  };
  testGet.send();
};

const sendData = (sessionStatus) => {
  const sessionInfo = hello('connect').getAuthResponse();
  const accessToken = sessionInfo.access_token;
  const date = new Date();
  const currentTime = String(date.toISOString());

  const status = sessionStatus;

  const sendTime = new XMLHttpRequest();
  sendTime.open('POST', `${connectURL}/parse/classes/sessionTimestamp`);

  sendTime.setRequestHeader('content-type', 'application/json');
  sendTime.setRequestHeader('x-parse-application-id', 'connect');
  sendTime.setRequestHeader('Authorization', `Bearer ${accessToken}`);

  sendTime.onreadystatechange = function () {
    if (sendTime.readyState === 4) {
      console.log(sendTime.status);
      console.log(sendTime.responseText);
    }
  };
  const data = {
    sessionId: 'BangleTest'
  };
  data[status]= currentTime;


  const jsonData = JSON.stringify(data);
  console.log(data);
  sendTime.send(jsonData);
};

const initHello = () => {
  // configure Connect network
  hello.init({ connect: config.connectOAuth });

  // listen to login changes
  hello.on('auth.login', (auth) => {
    hello(auth.network).api('me')
      .then(function (r) {
        console.log('response:', r);
        let label = document.getElementById('profile_' + auth.network);
        if (!label) {
          label = document.createElement('div');
          label.id = 'profile_' + auth.network;
          document.getElementById('profile').appendChild(label);
        }
        label.innerHTML = '<img src="' + r.thumbnail + '" /> Hey ' + r.name;
      });
  });

  // configure client
  hello.init({
    connect: config.clientId
  }, {
    /* eslint-disable camelcase */
    oauth_proxy: config.oauthProxy,
    redirect_uri: config.redirectURI
    /* eslint-enable camelcase */
  });
};

const init = () => {
  initHello();

  const connectToken = hello('connect').getAuthResponse();

  const isConnected = online(connectToken);

  if (isConnected) {
    displayConnected();
  } else {
    displayDisconnected();
  }
};

init();

