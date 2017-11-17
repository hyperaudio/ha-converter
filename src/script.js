
$(document).ready(function() {


  var namespace = null;
  if (document.location.hostname.indexOf('hyperaud') > 0) {
    namespace = document.location.hostname.substring(0, document.location.hostname.indexOf('hyperaud') - 1);
  }

  var prefix = '';
  if (namespace) prefix = namespace + '.';

  var domain;
  if (document.location.hostname.indexOf('hyperaud.io') > -1) {
    domain = 'hyperaud.io';
  } else {
    domain = 'hyperaudio.net';
  }

  var API = 'https://' + prefix + 'api.' + domain + '/v1';

  $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
    if (options.url.indexOf(API) == 0) {
      if (window.localStorage.getItem('token')) {
        jqXHR.setRequestHeader('Authorization', 'Bearer ' + window.localStorage.getItem('token'));
      }
    }
  });

  var mediaObject;
  var mediaID = purl(window.top.document.location.href).param('m');
  var transcriptID = purl(window.top.document.location.href).param('t');

  if (transcriptID) {
    $.get(API + '/transcripts/' + transcriptID, function(t) {
      transcriptObject = t;
      mediaObject = t.media;
      mediaID = mediaObject._id;
      //console.log(t.content);
      if (t.type == "srt") {
        $('#subtitles').text(t.content);
      }

      if (t.type == "html") {
        $('#htranscript').text(t.content);
      }

    });
  }


  // MB adding check to see if param is present

  /*console.log("checking for presence of param");
  console.log(document.location.href);
  console.log(window.top.document.location.href);*/

  if (mediaID && !transcriptID) {
    $.get(API + '/media/' + mediaID, function(m) {
      mediaObject = m;
      //console.log(m);
      // var media = "http://data.hyperaud.io/" + m.owner + "/" + m.meta.filename;
      //   $("#myVideo").append('<source src="' + media + '" type="video/mp4" />');
      //   $("#myVideo").append('<source src="' + media.replace('mp4', 'webm') + '" type="video/mp4" />');
    });
  }



  var user;
  function whoami(callback) {
    $.ajax(API+'/auth/whoami/' + window.localStorage.getItem('token'), {
     type: "GET",
     contentType: "application/json; charset=utf-8",
     success: function(whoami) {
        if (whoami.user) {
          // logged in
          //alert('logged in');
          user = whoami.user;

          var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"XHR","action":"User logged in (whoami)"}});
          document.dispatchEvent(event);

        } else {
          // not logged in
          //alert('NOT logged in');
          user = null;

          var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"XHR","action":"User NOT logged in (whoami)"}});
          document.dispatchEvent(event);
        }
        if (callback) callback();
      },
      xhrFields: {
        withCredentials: true
      },
        crossDomain: true
    });
  }

  var transcriptObject = null;
  $('#save-button').click(function() {
    $('#save-button').hide();
    $('#save-button-saving').show();

    var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"Button","action":"Save"}});
    document.dispatchEvent(event);

    whoami(function() {
      console.dir(user);
      if (user) {
        //
        if (transcriptObject) {
            $.ajax( API+'/transcripts/' + transcriptObject._id, {
              type: "PUT",
              contentType: "application/json; charset=utf-8",
              dataType: "json",
              data: JSON.stringify({
                _id: transcriptObject._id,
                label:  mediaObject?mediaObject.label:'',
                type: 'html',
                sort: 0,
                owner: user,
                content: $('#htranscript').val(),
                media: mediaID
              }),
              success: function(data) {
                transcriptObject = data;
                //console.log(data);
                $('#save-button-saving').hide();
                $('#save-button').show();

                var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"XHR","action":"Save success with initial transcriptObject"}});
                document.dispatchEvent(event);
              },
              error: function() {
                $('#save-button-saving').hide();
                $('#save-button').show();
                alert('Save Error');

                var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"XHR","action":"Save ERROR with initial transcriptObject"}});
                document.dispatchEvent(event);
              },
              xhrFields: {
                withCredentials: true
              },
              crossDomain: true
            });
        } else {
          $.ajax( API+'/transcripts', {
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify({
              label:  mediaObject.label,
              type: 'html',
              sort: 0,
              owner: user,
              content: $('#htranscript').val(),
              media: mediaID
            }),
            success: function(data) {
              transcriptObject = data;
              //console.log(data);
              $('#save-button-saving').hide();
              $('#save-button').show();

              var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"XHR","action":"Save success without initial transcriptObject"}});
              document.dispatchEvent(event);
            },
            error: function() {
              $('#save-button-saving').hide();
              $('#save-button').show();
              alert('Save Error');
              var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"XHR","action":"Save ERROR without initial transcriptObject"}});
              document.dispatchEvent(event);
            },
            xhrFields: {
              withCredentials: true
            },
            crossDomain: true
          });
        }
        //
      } else {

        var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"Alert","action":"Please sign in to save."}});
        document.dispatchEvent(event);
        alert('Please sign in to save.');
      }
    });
  });
});
