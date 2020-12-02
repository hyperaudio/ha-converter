var $ = jQuery; // needed for wordpress

$(document).ready(function() {
  var p = document.getElementById('para-split');
  var cp = document.getElementById('current-para-split');
  var paraSplitTime = p.value;
  var paraPunct = $('#para-punctuation').prop('checked');

  p.addEventListener(
    'input',
    function() {
      cp.innerHTML = p.value;
      paraSplitTime = p.value;
    },
    false
  );

  $('#para-punctuation').change(function() {
    if (this.checked) {
      paraPunct = $('#para-punctuation').prop('checked');
    }
  });

  $('#markup-view').click(function() {
    $('#rendered-view').addClass('inactive');
    $(this).removeClass('inactive');
    $('#rtranscript').hide();

    var regex = /\span>(.*?)\<span/g;

    var strToMatch = $('#rtranscript').html();

    while ((matches = regex.exec(strToMatch)) != null) {
      if (matches[1].length > 0) {
        strToMatch = strToMatch.replace("</span>"+matches[1], matches[1]+"</span>");
      } 
    }

    $('#htranscript').val(strToMatch);
    $('#htranscript').show();
    return false;
  });

  $('#rendered-view').click(function() {
    $('#markup-view').addClass('inactive');
    $(this).removeClass('inactive');
    $('#htranscript').hide();
    $('#rtranscript').html("<span>rendering...</span>");
    $('#rtranscript').show();
    
    setTimeout(renderTranscript, 100);

    return false;
  });

  function renderTranscript() {
    $('#rtranscript').html($('#htranscript').val());
  }

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

    var outputString = '<article><section><p>';
    var lineBreaks = $('#line-breaks').prop('checked');
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

        if (stime - ltime > paraSplitTime * 1000 && paraSplitTime > 0) {
          //console.log("fullstop? "+stext+" - "+stext.indexOf("."));
          var punctPresent =
            ltext && (ltext.indexOf('.') > 0 || ltext.indexOf('?') > 0 || ltext.indexOf('!') > 0);
          if (!paraPunct || (paraPunct && punctPresent)) {
            outputString += '</p><p>';
          }
        }

        outputString += '<span data-m="' + stime + '">' + stext + ' </span>';

        ltime = stime;
        ltext = stext;

        if (lineBreaks) outputString = outputString + '\n';
      }
    }
    return outputString + '</p></section></article>';
  }

  $('#transform').click(function() {
    $('#transform-spinner').show();
    $('#htranscript').val("converting...");
    setTimeout(generateTranscript, 100);
  });

  function generateTranscript() {

    var input = $('#subtitles').val();

    var ht;

    var format = $('#format-select').val();

    switch (format) {
        
      case 'google':
        var data = JSON.parse(input);
        
        var items = ['<article><section><p>'];

        /*var results;

        if (typeof results !== 'undefined') {
          results = data.response.results;
        } else {
          results = data.results;
        }

        console.log(results);

        if (typeof results === 'undefined') {
          results = data.results;
        }*/
        
        $.each(data.response.results, function(key, val) {
          $.each(val.alternatives, function(k, v) {
            for (var i = 0; i < v.words.length; i++) {
              items.push(
                '<span data-d="' +
                  Math.round(parseFloat(v.words[i].endTime) * 1000 - parseFloat(v.words[i].startTime) * 1000) +
                  '" data-m="' +
                  Math.round(parseFloat(v.words[i].startTime) * 1000) +
                  '">' +
                  v.words[i].word +
                  ' </span>'
              );


              if (i > 0 && Math.round(parseFloat(v.words[i].startTime)) - Math.round(parseFloat(v.words[i-1].startTime)) > paraSplitTime && paraSplitTime > 0) {
                items.push('</p><p>');
              }
            }
          });
        });

        items.push('</p></section></article>');

        ht = items.join('');
        break;
        
      case 'speechmatics':
        var data = JSON.parse(input);
        var items = ['<article><section><p>'];
        $.each(data, function(key, val) {
          if (key == 'words') {
            for (var i = 0; i < val.length; i++) {
              var punct = "";
              if ((i+1) < val.length && val[i+1].name === ".") {
                punct = ".";
              } 

              if (val[i].name !== ".") {
                items.push(
                  '<span data-d="' +
                    Math.round(val[i].duration * 1000) +
                    '" data-c="' +
                    val[i].confidence +
                    '" data-m="' +
                    Math.round(val[i].time * 1000) +
                    '">' +
                    val[i].name + punct +
                    ' </span>'
                );
              }
              
              if (i > 0 && Math.round(parseFloat(val[i].time)) - Math.round(parseFloat(val[i-1].time)) > paraSplitTime && paraSplitTime > 0) {
                if ((paraPunct && punct === ".") || (paraPunct === false)) {
                  items.push('</p><p>');
                }
              }
            }
          }
        });

        items.push('</p></section></article>');

        ht = items.join('');
        break;

      case 'gentle':
        var data = JSON.parse(input);

        wds = data['words'] || [];
        transcript = data['transcript'];

        var trans = document.createElement('p');

        trans.innerHTML = '';

        var currentOffset = 0;
        var wordCounter = 0;

        wds.forEach(function(wd) {
          // Add non-linked text

          var newlineDetected = false;

          if (wd.startOffset > currentOffset) {
            var txt = transcript.slice(currentOffset, wd.startOffset);
            newlineDetected = /\r|\n/.exec(txt);

            if (trans.lastChild) {
              trans.lastChild.text += txt + " ";
            } else {
              // this happens only at the beginning when offset not zero
              var span = document.createElement('span');
              var initialWd = document.createTextNode(txt + " ");
              var initialDatam = document.createAttribute('data-m');
              var initialDatad = document.createAttribute('data-d');

              span.appendChild(initialWd);
              initialDatam.value = 0;
              initialDatad.value = 0;
              span.setAttributeNode(initialDatam);
              span.setAttributeNode(initialDatad);
              trans.appendChild(span);
              trans.appendChild(span);
            }

            if (newlineDetected) {
              var lineBreak = document.createElement('br');
              trans.appendChild(lineBreak);
            }
            currentOffset = wd.startOffset;
          }

          var datam = document.createAttribute('data-m');
          var datad = document.createAttribute('data-d');

          var word = document.createElement('span');
          var txt = transcript.slice(wd.startOffset, wd.endOffset+1);
	          
	        if (!txt.endsWith(" ")){
	          txt = txt + " ";
	        }
	
	        var wordText = document.createTextNode(txt);
          word.appendChild(wordText);

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

          word.setAttributeNode(datam);
          word.setAttributeNode(datad);

          trans.appendChild(word);
          
          currentOffset = wd.endOffset;
          wordCounter++;
        });

        var txt = transcript.slice(currentOffset, transcript.length);
        var word = document.createTextNode(txt);
        trans.appendChild(word);
        currentOffset = transcript.length;

        article = document.createElement('article');
        section = document.createElement('section');
      
        section.appendChild(trans);
        article.appendChild(section);

        ht = article.outerHTML;

        //newlines can cause issues within HTML tags
        ht = ht.replace(/(?:\r\n|\r|\n)/g, '');

        ht = ht.replace(new RegExp('</span><br>', 'g'), '</span></p><p>');

        // replace all unneeded empty paras
        ht = ht.replace(new RegExp('<p></p>', 'g'), '');

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

        var transcriptText = transcript.outerHTML;

        ht = '<article>' + transcriptText + '</article>';
    }

    $('#htranscript').val(ht);
    $('#rtranscript').html(ht);

    $('#transform-spinner').hide();
    return false;
  }
});