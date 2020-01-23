$(document).ready(function() {
  var p = document.getElementById('para-split');
  var cp = document.getElementById('current-para-split');
  var paraSplitTime;

  p.addEventListener(
    'input',
    function() {
      cp.innerHTML = p.value;
      paraSplitTime = p.value;
    },
    false
  );

  $('#markup-view').click(function() {
    $('#rendered-view').addClass('inactive');
    $(this).removeClass('inactive');
    $('#rtranscript').hide();
    $('#htranscript').show();

    var event = new CustomEvent('ga', {
      detail: { origin: 'HA-Converter', type: 'View-Switch', action: 'Markup View' }
    });
    document.dispatchEvent(event);
    return false;
  });

  $('#rendered-view').click(function() {
    $('#rtranscript').html($('#htranscript').val());
    $('#markup-view').addClass('inactive');
    $(this).removeClass('inactive');
    $('#htranscript').hide();
    $('#rtranscript').show();

    var event = new CustomEvent('ga', {
      detail: { origin: 'HA-Converter', type: 'View-Switch', action: 'Rendered View' }
    });
    document.dispatchEvent(event);
    return false;
  });

  String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
  };

  // From popcorn.parserSRT.js

  function parseSRT(data) {
    var event = new CustomEvent('ga', {
      detail: { origin: 'HA-Converter', type: 'Function', action: 'parseSRT init' }
    });
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

    var toSeconds = function(t_in) {
      var t = t_in.split(':');

      try {
        var s = t[2].split(',');

        // Just in case a . is decimal seperator
        if (s.length === 1) {
          s = t[2].split('.');
        }

        return (
          parseFloat(t[0], 10) * 3600 +
          parseFloat(t[1], 10) * 60 +
          parseFloat(s[0], 10) +
          parseFloat(s[1], 10) / 1000
        );
      } catch (e) {
        return 0;
      }
    };

    var outputString = '<article><header></header><section><header></header><p>';
    var lineBreaks = $('#line-breaks').prop('checked');
    var paraPunct = $('#para-punctuation').prop('checked');
    var ltime = 0;
    var ltext;

    // Here is where the magic happens
    // Split on line breaks
    lines = data.split(/(?:\r\n|\r|\n)/gm);
    len = lines.length;

    for (i = 0; i < len; i++) {
      sub = {};
      text = [];

      sub.id = parseInt(lines[i++], 10);

      // Split on '-->' delimiter, trimming spaces as well

      try {
        time = lines[i++].split(/[\t ]*-->[\t ]*/);
      } catch (e) {
        alert('Warning. Possible issue on line ' + i + ": '" + lines[i] + "'.");
        break;
      }

      sub.start = toSeconds(time[0]);

      // So as to trim positioning information from end
      if (!time[1]) {
        alert('Warning. Issue on line ' + i + ": '" + lines[i] + "'.");
        return;
      }

      idx = time[1].indexOf(' ');
      if (idx !== -1) {
        time[1] = time[1].substr(0, idx);
      }
      sub.end = toSeconds(time[1]);

      // Build single line of text from multi-line subtitle in file
      while (i < len && lines[i]) {
        text.push(lines[i++]);
      }

      // Join into 1 line, SSA-style linebreaks
      // Strip out other SSA-style tags
      sub.text = text.join('\\N').replace(/\{(\\[\w]+\(?([\w\d]+,?)+\)?)+\}/gi, '');

      // Escape HTML entities
      sub.text = sub.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      // Unescape great than and less than when it makes a valid html tag of a supported style (font, b, u, s, i)
      // Modified version of regex from Phil Haack's blog: http://haacked.com/archive/2004/10/25/usingregularexpressionstomatchhtml.aspx
      // Later modified by kev: http://kevin.deldycke.com/2007/03/ultimate-regular-expression-for-html-tag-parsing-with-php/
      sub.text = sub.text.replace(
        /&lt;(\/?(font|b|u|i|s))((\s+(\w|\w[\w\-]*\w)(\s*=\s*(?:\".*?\"|'.*?'|[^'\">\s]+))?)+\s*|\s*)(\/?)&gt;/gi,
        '<$1$3$7>'
      );
      //sub.text = sub.text.replace( /\\N/gi, "<br />" );
      sub.text = sub.text.replace(/\\N/gi, ' ');

      var splitMode = 0;

      var wordLengthSplit = $('#word-length').prop('checked');

      // enhancements to take account of word length

      var swords = sub.text.split(' ');
      var sduration = sub.end - sub.start;
      var stimeStep = sduration / swords.length;

      // determine length of words

      var swordLengths = [];
      var swordTimes = [];

      var totalLetters = 0;
      for (var si = 0, sl = swords.length; si < sl; ++si) {
        totalLetters = totalLetters + swords[si].length;
        swordLengths[si] = swords[si].length;
      }

      var letterTime = sduration / totalLetters;
      var wordStart = 0;

      for (var si = 0, sl = swords.length; si < sl; ++si) {
        var wordTime = swordLengths[si] * letterTime;
        var stime;
        if (wordLengthSplit) {
          stime = Math.round((sub.start + si * stimeStep) * 1000);
          var event = new CustomEvent('ga', {
            detail: { origin: 'HA-Converter', type: 'Setting', action: 'Word length split ON' }
          });
          document.dispatchEvent(event);
        } else {
          stime = Math.round((wordStart + sub.start) * 1000);
          var event = new CustomEvent('ga', {
            detail: { origin: 'HA-Converter', type: 'Setting', action: 'Word length split OFF' }
          });
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

        if (stime - ltime > paraSplitTime * 1000 && paraSplitTime > 0) {
          //console.log("fullstop? "+stext+" - "+stext.indexOf("."));
          var punctPresent =
            ltext && (ltext.indexOf('.') > 0 || ltext.indexOf('?') > 0 || ltext.indexOf('!') > 0);
          if (!paraPunct || (paraPunct && punctPresent)) {
            outputString += '</p><p>';
          }
        }

        outputString += '<a data-m="' + stime + '">' + stext + ' </a>';

        ltime = stime;
        ltext = stext;

        if (lineBreaks) outputString = outputString + '\n';
      }
    }
    return outputString + '</p><footer></footer></section></footer></footer></article>';
    var event = new CustomEvent('ga', {
      detail: { origin: 'HA-Converter', type: 'Function', action: 'parseSRT finished' }
    });
    document.dispatchEvent(event);
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

    var format = $('#format-select').val();
    console.log('format=' + format);

    switch (format) {
        
      case 'google':
        var data = JSON.parse(input);
        var items = ['<article><header></header><section><header></header><p>'];
        $.each(data.response.results, function(key, val) {
          $.each(val.alternatives, function(k, v) {
            for (var i = 0; i < v.words.length; i++) {
              items.push(
                '<a data-d="' +
                  Math.round(parseFloat(v.words[i].endTime) * 1000 - parseFloat(v.words[i].startTime) * 1000) +
                  '" data-m="' +
                  Math.round(parseFloat(v.words[i].startTime) * 1000) +
                  '">' +
                  v.words[i].word +
                  ' </a>'
              );
            }
          });
        });

        items.push('</p><footer></footer></section></footer></footer></article>');

        /*$( "<article/>", {
          html: items.join( "" )
        }).appendTo( "body" );*/
        ht = items.join('');
        break;
        
      case 'speechmatics':
        var data = JSON.parse(input);
        var items = ['<article><header></header><section><header></header><p>'];
        $.each(data, function(key, val) {
          if (key == 'words') {
            for (var i = 0; i < val.length; i++) {
              items.push(
                '<a data-d="' +
                  Math.round(val[i].duration * 1000) +
                  '" data-c="' +
                  val[i].confidence +
                  '" data-m="' +
                  Math.round(val[i].time * 1000) +
                  '">' +
                  val[i].name +
                  ' </a>'
              );
            }
          }
        });

        items.push('</p><footer></footer></section></footer></footer></article>');

        /*$( "<article/>", {
          html: items.join( "" )
        }).appendTo( "body" );*/
        ht = items.join('');
        break;

      case 'gentle':
        var data = JSON.parse(input);

        wds = data['words'] || [];
        transcript = data['transcript'];

        $trans = document.createElement('p');

        //$trans = document.getElementById("htranscript");
        $trans.innerHTML = '';

        var currentOffset = 0;
        var wordCounter = 0;

        wds.forEach(function(wd) {
          // Add non-linked text

          var newlineDetected = false;

          if (wd.startOffset > currentOffset) {
            var txt = transcript.slice(currentOffset, wd.startOffset);
            newlineDetected = /\r|\n/.exec(txt);

            var $plaintext = document.createTextNode(txt);
            //console.log("lastChild");
            //console.dir($trans.lastChild);
            if ($trans.lastChild) {
              //$trans.lastChild.appendChild($plaintext);
              $trans.lastChild.text += txt;
            } else {
              // this happens only at the beginning
              var anchor = document.createElement('a');
              var initialDatam = document.createAttribute('data-m');
              var initialDatad = document.createAttribute('data-d');

              anchor.appendChild($plaintext);
              initialDatam.value = 0;
              initialDatad.value = 0;
              anchor.setAttributeNode(initialDatam);
              anchor.setAttributeNode(initialDatad);
              $trans.appendChild(anchor);
            }
            //$trans.appendChild($plaintext);
            if (newlineDetected) {
              var lineBreak = document.createElement('br');
              $trans.appendChild(lineBreak);
            }
            currentOffset = wd.startOffset;
          }

          var datam = document.createAttribute('data-m');
          var datad = document.createAttribute('data-d');

          var $wd = document.createElement('a');
          var txt = transcript.slice(wd.startOffset, wd.endOffset);
          var $wdText = document.createTextNode(txt);
          $wd.appendChild($wdText);

          wd.$div = $wd;

          if (wd.start !== undefined) {
            datam.value = Math.floor(wd.start * 1000);
            datad.value = Math.floor((wd.end - wd.start) * 1000);
          } else {
            // look ahead to the next timed word
            for (var i = wordCounter; i < wds.length - 1; i++) {
              if (wds[i + 1].start !== undefined) {
                datam.value = Math.floor(wds[i + 1].start * 1000);
                break;
              }
            }
            datad.value = '100'; // default duration when not known
          }

          $wd.setAttributeNode(datam);
          $wd.setAttributeNode(datad);

          $trans.appendChild($wd);
          currentOffset = wd.endOffset;
          wordCounter++;
        });

        var txt = transcript.slice(currentOffset, transcript.length);
        var $plaintext = document.createTextNode(txt);
        $trans.appendChild($plaintext);
        currentOffset = transcript.length;

        $article = document.createElement('article');
        $section = document.createElement('section');
        $header = document.createElement('header');

        $section.appendChild($trans);
        $article.appendChild($section);

        ht = $article.outerHTML;

        //newlines can cause issues within HTML tags
        ht = ht.replace(/(?:\r\n|\r|\n)/g, '');

        ht = ht.replace(new RegExp('</a><br>', 'g'), '</a></p><p>');

        // replace all unneeded empty paras
        ht = ht.replace(new RegExp('<p></p>', 'g'), '');

        console.dir(ht);
        break;

      case 'srt':
        ht = parseSRT(input);
        break;

      case 'other':
        var xmlString = input,
          parser = new DOMParser(),
          doc = parser.parseFromString(xmlString, 'text/xml');

        var transcript = doc.getElementsByTagName('section')[0];

        for (var i = 0; i < doc.getElementsByClassName('speaker').length; i++) {
          transcript.getElementsByClassName('speaker')[i].innerHTML =
            '[' +
            transcript.getElementsByClassName('speaker')[i].innerHTML.replace(': ', '') +
            '] ';
          var datam = document.createAttribute('data-m');
          var datad = document.createAttribute('data-d');
          datam.value = transcript
            .getElementsByClassName('speaker')
            [i].nextElementSibling.getAttribute('data-m');
          datad.value = '1';
          transcript.getElementsByClassName('speaker')[i].setAttributeNode(datam);
          transcript.getElementsByClassName('speaker')[i].setAttributeNode(datad);
        }
        //console.log(transcript);

        var transcriptText = transcript.outerHTML;
        transcriptText = transcriptText.replaceAll('<span', '<a');
        transcriptText = transcriptText.replaceAll('</span>', '</a>');

        ht = '<article>' + transcriptText + '</article>';

      //console.log(ht);

      //str = str.replace(/<title>[\s\S]*?<\/title>/, '<title>' + newTitle + '<\/title>');
    }

    /*ht = ht.replace(/\r\n|\r|\n/gi, '<br/>');   */

    $('#htranscript').val(ht);
    $('#rtranscript').html(ht);
    //console.log($('#subtitles').text());

    $('.transform-spinner').hide();
    var event = new CustomEvent('ga', {
      detail: { origin: 'HA-Converter', type: 'Button', 'Transform SRT': 'parseSRT finished' }
    });
    document.dispatchEvent(event);
    return false;
  });
});
