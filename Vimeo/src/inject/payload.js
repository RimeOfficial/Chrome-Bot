console.log('loaded!');

var my_url = 'https://vimeo.com/user42434394';

var base_url = 'https://vimeo.com';
var current_url = window.location.href;
var current_uri = window.location.pathname;

var hash = window.location.hash;

localforage.config({
  driver      : localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
  name        : 'myApp',
  version     : 1.0,
  size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
  storeName   : 'keyvaluepairs', // Should be alphanumeric, with underscores.
  description : 'some description'
});

$(document).ready(function() {
  // hash callback
  if (hash !== '') {
    var fn = window[ hash.substr(1) ];
    if(typeof fn === 'function') { fn(); }
  }

  // decider
  get_next();
});

function get_next(callback) {
  var new_follow = 0;
  var old_follow = 0;

  var today = Date();
  localforage.iterate(function(value, key, iterationNumber) {

    if (value.follow !== undefined) {
      var diff_sec = time_diff_sec(value.follow);
      if (diff_sec < (24 * 60 * 60)) { // 24 hrs
        new_follow = new_follow + 1;
      }
      else if (value.unfollow == undefined) {
        old_follow = old_follow + 1;
      }
    }

  }, function() {
    console.log('Todays task count: ' + new_follow);
    console.log('Old task count: ' + old_follow);

    var next_task_url = null;

    localforage.iterate(function(value, key, iterationNumber) {
      if (next_task_url == null) {
        if (value.follow == undefined) {
          // randomly generated todays task count
          var max_new_follow = 400 + (rand(100) + 1); // 400 to 500

          if (new_follow < max_new_follow) {
            console.log('Follow: ' + key);
            next_task_url = key + '#follow_unfollow'; // 1. follow
          }
        }
        else {
          if (value.videos == undefined) {
            console.log('Get videos: ' + key);
            next_task_url = key + '/videos#get_videos'; // 2. get videos
          }
          else {
            for (var i = 0; i < value.videos.length; i++) {
              if (value.videos[i].like == undefined) {
                console.log('Like: ' + value.videos[i].url);
                next_task_url = value.videos[i].url + '#like_unlike'; // 3. like
                break;
              }
            }
          }

          if (next_task_url == null) {
            if (value.msg == undefined) {
              console.log('Message: ' + key);
              next_task_url = key + '#msg'; // 4. message
            }
            else {
              var diff_sec = time_diff_sec(value.follow);
              if (diff_sec > (24 * 60 * 60)) {

                // after 24 hrs
                
                for (var i = 0; i < value.videos.length; i++) {
                  if (value.videos[i].unlike == undefined) {
                    console.log('Unlike: ' + value.videos[i].url);
                    next_task_url = value.videos[i].url + '#like_unlike'; // 5. unlike
                    break;
                  }
                }

                if (next_task_url == null) {
                  if (value.unfollow == undefined) {
                    console.log('Unfollow: ' + key);
                    next_task_url = key + '#follow_unfollow'; // 6. unfollow
                  }
                }
              }
            }
          }
        }
      }
    }, function() {
      console.log('Iteration is complete');

      if (next_task_url !== null) {
        console.log('Redirect to: ' + next_task_url);
        window.location = next_task_url;
      }
      else console.log('All done!');
    });
  });
}


// ////////////////// hash methods //////////////////

// https://vimeo.com/01234567#like_unlike

function like_unlike() {
  // get author
  var user_url = $("a[rel=author]").attr('href');
  if (user_url != undefined) {
    user_url = base_url + user_url;

    key = user_url;
    console.log('key: ' + key);
    // console.log(base_url + current_uri);

    localforage.getItem(key, function(err, value) {
      if (value != null && value.videos != undefined) {
        for (var i = 0; i < value.videos.length; i++) {
          if (value.videos[i].url == (base_url + current_uri)) {

            // mark like
            $("div[class=box]").each(function() {
              // console.log($(this).find('label').text());
              var state = $(this).find('label').text();

              if (state == 'Like' || state == 'Unlike') {
                var d = $(this).find('button');

                if (value.videos[i].like == undefined) {
                  value.videos[i].like = Date();

                  if (state == 'Like') {
                    $(d).click();
                    console.log(state + ' <3');
                  }
                }
                else if (value.videos[i].unlike == undefined) {
                  value.videos[i].unlike = Date();

                  if (state == 'Unlike') {
                    $(d).click();
                    console.log(state + ' 3<');
                  }
                }
              }
            });

            localforage.setItem(key, value, function(err, value) {});
          }
        };
      }
      else { console.log('Video not found in db'); }
    });
  }
  else { console.log('Author not found in db'); }
}


// https://vimeo.com/user0123456#msg

function msg() {
  key = base_url + current_uri;
  console.log('key: ' + key);

  localforage.getItem(key, function(err, value) {
    // console.log(value);

    if (value.msg == undefined) {
      var name = $('h1').first().find('span').first().text();

      // class="message btn iconify_envelope_b en"
      $('a.message.btn').each(function(i) {
        var state = $(this).text();

        if (state == 'Message') {
          this.click();

          window.setTimeout(function() {
            var custom_msg = 'Hey ' + name +",\n\
\n\
I am the founder of Rime, a search and discovery platform to explore creative content (stories, art, video, photo, recipies, etc), and creative people on the internet. Rime helps you to connect multiple social media accounts and brings all your shared content to one timeline. It creates unique identity which holds all your online presence and makes it easier for other people to follow you and know more about you. Check out my profile https://rime.co/@girish/about\n\
\n\
Rime is still in public beta so here is the invitation link\n\
https://rime.co/?invited_by=girish\n\
\n\
Please give us feedback and invite your friends too. Thanks a lot for your time,\n\
\n\
Girish Nayak\n\
Web: https://rime.co/@Girish\n\
E-mail: girish@rime.co";

            $('#cm_message').val(custom_msg);

            $('.btn.btn_submit').first().click();
          }, 1000);

          value.msg = Date();
          localforage.setItem(key, value, function(err, value) {});
        }
      });
    }
  });
}


// https://vimeo.com/user0123456#follow_unfollow

function follow_unfollow() {
  key = base_url + current_uri;
  console.log('key: ' + key);

  localforage.getItem(key, function(err, value) {
    // console.log(value);

    $('a[id=follow_btn]').each(function(i) {
      var state = $(this).text();

      if (state == 'Follow' || state == 'Following') {

        if (value.follow == undefined) {
          value.follow = Date();

          if (state == 'Follow') {
            this.click();
            console.log(state + ' <3');
          }
        }
        else if (value.unfollow == undefined) {
          value.unfollow = Date();

          if (state == 'Following') {
            this.click();
            console.log('state' + ' 3<');
          }
        }

        localforage.setItem(key, value, function(err, value) {});
      }
    });
  });
}


// https://vimeo.com/user0123456/videos#get_videos

function get_videos() {
  key = base_url + current_uri;

  // https://vimeo.com/user0123456/videos => https://vimeo.com/user0123456
  key = key.substring(0, key.length - 7) ;
  console.log('key: ' + key);

  localforage.getItem(key, function(err, value) {
    // console.log(value);

    if (value.videos == undefined) {
      // get videos
      var videos = [];
      $("li[id^=clip]").each(function(i) {
        var video_url = $(this).find('a').attr('href');
        video_url = base_url + video_url;

        videos.push(video_url);
      });

      value.videos = [];

      var count = videos.length;
      if (count > 0) {

        var max_pick = 2;
        max_pick = rand(max_pick) + 1; // pick at-least 1
        max_pick = Math.min(max_pick, count);

        for (var i = 0; i < max_pick; i++) {
          var rand_index = rand(count);

          if (videos[rand_index] != null) {
            video = {};
            video.url = videos[rand_index];

            value.videos.push(video);

            videos[rand_index] = null;
          }
        };
      }
      
      console.log('Picked: ' + value.videos.length + ' video(s)');
      localforage.setItem(key, value, function(err, value) {});
    }
  });
}


// ////////////////// utility //////////////////

function rand(max) { return Math.floor((Math.random() * max)); }

function time_diff_sec(ago) {
  var today = new Date();
  var ago = new Date(ago);

  var msec = today.getTime() - ago.getTime();

  // var hh = Math.floor(msec / 1000 / 60 / 60);
  // msec -= hh * 1000 * 60 * 60;
  // var mm = Math.floor(msec / 1000 / 60);
  // msec -= mm * 1000 * 60;
  // var ss = Math.floor(msec / 1000);
  // msec -= ss * 1000;

  // console.log(hh + ":" + mm + ":" + ss);
  return msec/1000;
}