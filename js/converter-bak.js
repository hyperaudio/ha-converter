$(document).ready(function(){

  var p = document.getElementById("para-split");
  var cp = document.getElementById("current-para-split");
  var paraSplitTime;

  p.addEventListener('input',function(){
    cp.innerHTML = p.value;
    paraSplitTime = p.value;
  },false);

  $('#markup-view').click(function(){
    $('#rendered-view').addClass('inactive');
    $(this).removeClass('inactive');
    $('#rtranscript').hide();
    $('#htranscript').show();

    var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"View-Switch","action":"Markup View"}});
    document.dispatchEvent(event);
    return false;
  });

  $('#rendered-view').click(function(){
    $('#rtranscript').html($('#htranscript').val());
    $('#markup-view').addClass('inactive');
    $(this).removeClass('inactive');
    $('#htranscript').hide();
    $('#rtranscript').show();

    var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"View-Switch","action":"Rendered View"}});
    document.dispatchEvent(event);
    return false;
  });

  // From popcorn.parserSRT.js

  function parseSRT(data) {

    var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"Function","action":"parseSRT init"}});
    document.dispatchEvent(event);

    var i = 0,
    len = 0,
    idx = 0,
    lines,
    time,
    text,
    sub;

    // Simple function to convert HH:MM:SS,MMM or HH:MM:SS.MMM to SS.MMM
    // Assume valid, returns 0 on error

    var toSeconds = function( t_in ) {
      var t = t_in.split( ':' );

      try {
        var s = t[2].split( ',' );

        // Just in case a . is decimal seperator
        if ( s.length === 1 ) {
          s = t[2].split( '.' );
        }

        return parseFloat( t[0], 10 )*3600 + parseFloat( t[1], 10 )*60 + parseFloat( s[0], 10 ) + parseFloat( s[1], 10 )/1000;
      } catch ( e ) {
        return 0;
      }
    };

    var outputString = "<article><header></header><section><header></header><p>";
    var lineBreaks = $('#line-breaks').prop('checked');
    var paraPunct = $('#para-punctuation').prop('checked');
    var ltime = 0;
    var ltext;

    // Here is where the magic happens
    // Split on line breaks
    lines = data.split( /(?:\r\n|\r|\n)/gm );
    len = lines.length;

    for( i=0; i < len; i++ ) {

      sub = {};
      text = [];

      sub.id = parseInt( lines[i++], 10 );

      // Split on '-->' delimiter, trimming spaces as well

      try {
        time = lines[i++].split( /[\t ]*-->[\t ]*/ );
      }
      catch (e) {
        alert("Warning. Possible issue on line "+i+": '"+lines[i]+"'.");
        break;
      }

      sub.start = toSeconds( time[0] );

      // So as to trim positioning information from end
      if (!time[1]) {
        alert("Warning. Issue on line "+i+": '"+lines[i]+"'.");
        return;
      }

      idx = time[1].indexOf( " " );
      if ( idx !== -1) {
        time[1] = time[1].substr( 0, idx );
      }
      sub.end = toSeconds( time[1] );

      // Build single line of text from multi-line subtitle in file
      while ( i < len && lines[i] ) {
        text.push( lines[i++] );
      }

      // Join into 1 line, SSA-style linebreaks
      // Strip out other SSA-style tags
      sub.text = text.join( "\\N" ).replace( /\{(\\[\w]+\(?([\w\d]+,?)+\)?)+\}/gi, "" );

      // Escape HTML entities
      sub.text = sub.text.replace( /</g, "&lt;" ).replace( />/g, "&gt;" );

      // Unescape great than and less than when it makes a valid html tag of a supported style (font, b, u, s, i)
      // Modified version of regex from Phil Haack's blog: http://haacked.com/archive/2004/10/25/usingregularexpressionstomatchhtml.aspx
      // Later modified by kev: http://kevin.deldycke.com/2007/03/ultimate-regular-expression-for-html-tag-parsing-with-php/
      sub.text = sub.text.replace( /&lt;(\/?(font|b|u|i|s))((\s+(\w|\w[\w\-]*\w)(\s*=\s*(?:\".*?\"|'.*?'|[^'\">\s]+))?)+\s*|\s*)(\/?)&gt;/gi, "<$1$3$7>" );
      //sub.text = sub.text.replace( /\\N/gi, "<br />" );
      sub.text = sub.text.replace( /\\N/gi, " " );

      var splitMode = 0;

      var wordLengthSplit = $('#word-length').prop('checked');

      // enhancements to take account of word length

      var swords = sub.text.split(' ');
      var sduration = sub.end - sub.start;
      var stimeStep = sduration/swords.length;

      // determine length of words

      var swordLengths = [];
      var swordTimes = [];

      var totalLetters = 0;
      for (var si=0, sl=swords.length; si<sl; ++si) {
        totalLetters = totalLetters + swords[si].length;
        swordLengths[si] = swords[si].length;
      }

      var letterTime = sduration / totalLetters;
      var wordStart = 0;

      for (var si=0, sl=swords.length; si<sl; ++si) {
        var wordTime = swordLengths[si]*letterTime;
        var stime;
        if (wordLengthSplit) {
          stime = Math.round((sub.start + si*stimeStep) * 1000);
          var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"Setting","action":"Word length split ON"}});
          document.dispatchEvent(event);
        } else {
          stime = Math.round((wordStart + sub.start) * 1000);
          var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"Setting","action":"Word length split OFF"}});
          document.dispatchEvent(event);
        }

        wordStart = wordStart + wordTime;
        var stext = swords[si];
        //var ssafeText = stext.replace('"', '\\"');
        //outputString += '<span m="'+stime+'" oval="'+ssafeText+'">'+stext+'</span> '+'\n';

        /*console.log("stime");
        console.log(stime);
        console.log("ltime");
        console.log(ltime);
        console.log("diff");
        console.log(stime - ltime);
        console.log(ltext);*/

        if (((stime - ltime) > paraSplitTime * 1000) && paraSplitTime > 0)  {
          //console.log("fullstop? "+stext+" - "+stext.indexOf("."));
          var punctPresent = ltext && (ltext.indexOf(".") > 0 || ltext.indexOf("?") > 0 || ltext.indexOf("!") > 0);
          if (!paraPunct || (paraPunct && punctPresent)) {
            outputString += '</p><p>';
          }
        }

        outputString += '<a data-m="'+stime+'">'+stext+' </a>';

        ltime = stime;
        ltext = stext;

        if (lineBreaks) outputString = outputString + '\n';
      }

    }
    return outputString + "</p><footer></footer></section></footer></footer></article>";
    var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"Function","action":"parseSRT finished"}});
    document.dispatchEvent(event);
  }


  /*$.get('test.srt', function(data) {
    console.log(data);
    console.log(parseSRT(data));
  });*/

  // http://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
  // Using the slower version because I want to use reserved regexp characters

  String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
  };

  function removeNewlines(s) {
    return s.replaceAll('\n','').replaceAll('\r','');
  }

  function removePunctuation(s) {
    return s.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@"\+\?><\[\]\+]/g, '');
  }

  $('#transform').click(function() {

    $('.transform-spinner').show();

    var input = $('#subtitles').val();
    /*var regex = /<br\s*[\/]?>/gi;
    srt = srt.replace(regex,'\n');
    regex = /&gt;/gi;
    srt = srt.replace(regex,'>');
    //console.log(srt);*/

    var ht;

    var format = $( "#format-select" ).val();
    console.log("format="+format);

    switch (format) {
      case 'speechmatics':
        var data = JSON.parse(input);
        var items = ['<article><header></header><section><header></header><p>'];
        $.each( data, function( key, val ) {
          if (key == "words") {
            for (var i=0; i < val.length; i++) {
              items.push( '<a data-d="' + Math.round(val[i].duration * 1000) + '" data-c="' + val[i].confidence + '" data-m="' + Math.round(val[i].time * 1000) + '">' + val[i].name + ' </a>' );
            }
          }
        });

        items.push('</p><footer></footer></section></footer></footer></article>');

        /*$( "<article/>", {
          html: items.join( "" )
        }).appendTo( "body" );*/
        ht = items.join( "" );
        break;


      case 'gentle':
        console.log("processing gentle");
        console.log("testing new lines and dead words");
        var data = JSON.parse(input);
        var items = ['<article><header></header><section><header></header><p>'];
        // Here we split the transcript object into an array as it and only it contains all the punctuation!
        var transcriptData = data.transcript.replaceAll("\n","\n ").split(" ");
        var currentOffset = 0;


        $.each( data, function( key, val ) {
          if (key == "words") {

            var lastEnd = 0;
            var lastStart = 0;
            var nextStart = 0;
            var lastEndOffset = 0;

            for (var i=0; i < val.length; i++) {

              console.log("+");

              //as the transcript object contains words that are not always in the word array we need to check they match

              /*while (removeNewlines(removePunctuation(transcriptData[k])) != val[i].word) {


              }*/

              // maintain newlines from the submitted transcript





              if(val[i].startOffset > currentOffset) {
                var thisWord = removeNewlines(data.transcript.slice(currentOffset,val[i].startOffset));
                if (thisWord != " ") {
                  items.push( '<a data-d="100" data-m="' + lastStart + '">' + thisWord + ' </a>' );
                }
                currentOffset = val[i].startOffset;
              }

              currentOffset = val[i].endOffset;

              if (val[i].case == "success") {
                var duration = Math.round(val[i].end * 1000) - Math.round(val[i].start * 1000);
                var punctuation = "";

                //look ahead to see if the next char is a punctuation mark
                if (i < val.length - 1 && val[i+1].startOffset > currentOffset) {
                  var lookAheadText = removeNewlines(data.transcript.slice(currentOffset,val[i+1].startOffset));

                  if (lookAheadText.indexOf(".") >= 0 || lookAheadText.indexOf(",") >= 0 || lookAheadText.indexOf(";") >= 0 || lookAheadText.indexOf(":") >= 0 || lookAheadText.indexOf("!") >= 0 || lookAheadText.indexOf("?") >= 0) {
                    punctuation = lookAheadText[0];
                    currentOffset++;
                  }
                  lastStart = Math.round(val[i].start * 1000);
                }

                items.push( '<a data-d="' + duration + '" data-m="' + Math.round(val[i].start * 1000) + '">' + data.transcript.slice(val[i].startOffset,val[i].endOffset) + punctuation + ' </a>' );
                lastEnd = Math.round(val[i].end * 1000);
              } else { //not-found-in-audio
                //check for next start time - we'll use this to calculate the duration of a non-timed word
                var j = i;
                while (j < (val.length - 1)) {
                  j++;
                  if (val[j].case == "success") {
                    nextStart = Math.round(val[j].start * 1000);
                    break;
                  }
                }

                items.push( '<a data-d="' + (nextStart - lastEnd) + '" data-m="' + lastEnd + '">' + data.transcript.slice(val[i].startOffset,val[i].endOffset) + ' </a>' );

              }

              // look ahead to see where to end the paragraph

              if (i > 0) {
                console.log("val[i-1].endOffSet: "+val[i-1].endOffset);
                console.log("currentOffset:" +currentOffset);
                var lookAhead = data.transcript.slice(currentOffset+1,currentOffset+5);
                console.log("current word: "+data.transcript.slice(val[i].startOffset,val[i].endOffset));
                console.log("lookAhead="+lookAhead+"<-");
                if (lookAhead.indexOf("\r") >= 0 || lookAhead.indexOf("\n") >= 0) { // contains a newline char

                  items.push("</p><p>");
                }
              }


            }
          }

        });

        items.push('</p><footer></footer></section></footer></footer></article>');
        ht = items.join( "" );
        console.log("done");
        break;

      case 'srt':
        ht = parseSRT(input);
        break;
    }


    /*ht = ht.replace(/\r\n|\r|\n/gi, '<br/>');   */

    $('#htranscript').val(ht);
    $('#rtranscript').html(ht);
    //console.log($('#subtitles').text());

    $('.transform-spinner').hide();
    var event = new CustomEvent("ga", {"detail":{"origin":"HA-Converter","type":"Button","Transform SRT":"parseSRT finished"}});
    document.dispatchEvent(event);
    return false;
  });
});
