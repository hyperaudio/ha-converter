(function() {
  var uniqueCookieId = "hyperaudio-converter-hint=true";
  var init, setupShepherd;

  init = function() {
    return setupShepherd();
  };

  setupShepherd = function() {
    var shepherd;

    // set the cookie

    document.cookie = uniqueCookieId;

    shepherd = new Shepherd.Tour({
      defaults: {
        classes: 'shepherd-element shepherd-open shepherd-theme-arrows',
        showCancelLink: true
      }
    });
    shepherd.addStep('welcome', {
      text: ['The Hyperaudio Converter allows you to create a Hyperaudio compatible timed transcript (hypertranscript) from various formats.'],
      attachTo: '.instructions',
      classes: 'shepherd shepherd-open shepherd-theme-arrows shepherd-transparent-text',
      buttons: [
        {
          text: 'Exit',
          classes: 'shepherd-button-secondary',
          action: shepherd.cancel
        }, {
          text: 'Next',
          action: shepherd.next,
          classes: 'shepherd-button-example-primary'
        }
      ]
    });
    shepherd.addStep('one', {
      text: 'We support SRT files and Speechmatics JSON. Just paste the files into the left-hand panel.',
      attachTo: '#subtitles',
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: shepherd.back
        }, {
          text: 'Next',
          action: shepherd.next
        }
      ]
    });
    shepherd.addStep('two', {
      text: 'We estimate word-level timings in the case of subtitles, you can specify whether we take word length into account.',
      attachTo: '#word-length',
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: shepherd.back
        }, {
          text: 'Next',
          action: shepherd.next
        }
      ]
    });
    shepherd.addStep('three', {
      text: 'You can choose a level of transcript formatting by specifying how much of a delay constitutes a paragraph break.',
      attachTo: '#para-split',
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: shepherd.back
        }, {
          text: 'Next',
          action: shepherd.next
        }
      ]
    });
    shepherd.addStep('four', {
      text: 'You may only want to split into paragraphs when the sentence finishes with certain punctuation points.',
      attachTo: '#para-punctuation',
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: shepherd.back
        }, {
          text: 'Next',
          action: shepherd.next
        }
      ]
    });
    shepherd.addStep('five', {
      text: 'When you are ready hit the big "Transform" button.',
      attachTo: '#transform',
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: shepherd.back
        }, {
          text: 'Next',
          action: shepherd.next
        }
      ]
    });
    shepherd.addStep('six', {
      text: 'You can inspect the timings and markup of the transcript in "Markup View".',
      attachTo: '#markup-view',
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: shepherd.back
        }, {
          text: 'Next',
          action: shepherd.next
        }
      ]
    });
    shepherd.addStep('seven', {
      text: 'Or take a look at how it will look on the page in "Rendered View".',
      attachTo: '#rendered-view',
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: shepherd.back
        }, {
          text: 'Next',
          action: shepherd.next
        }
      ]
    });
    shepherd.addStep('seven', {
      text: 'Remember to save your work before moving on!',
      attachTo: '#save-button',
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: shepherd.back
        }, {
          text: 'Done',
          action: shepherd.next
        }
      ]
    });
    return shepherd.start();
  };


  if (document.cookie.indexOf(uniqueCookieId) < 0) {
    $(init);
  };

 

}).call(this);
