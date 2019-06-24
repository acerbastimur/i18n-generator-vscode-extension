const translator = require("@k3rn31p4nic/google-translate-api");
var fs = require("fs");
var async = require("async");
var traverse = require("traverse");
const vscode = require("vscode");

var TRANSERR = {
  NOT_TRANSLATED: 1,
  IS_URL: 2
};

// RUN
var run = function(dir, sourceLanguage, languages, finish) {
  vscode.window.showInformationMessage("Wait until translation is done");

  // TRANSLATE
  var translate = function(text, language, callback) {
    // passthrough if contains HTML
    if (/<[a-z][\s\S]*>/i.test(text) == true) {
      return callback(TRANSERR.NOT_TRANSLATED, text);
    }

    // it is just a url
    if (text.indexOf("http://") == 0 && text.indexOf(" ") < 0) {
      return callback(TRANSERR.IS_URL, text);
    }

    /*  translateFree(
      {
        // FREE TRANSLATE
        text: text,
        source: sourceLanguage,
        target: language
      },
      translatedText => {
        console.log(translatedText);
        return callback(null,translatedText.translation);
      }
    ); */

    translator(text, { from: sourceLanguage, to: language }).then(res => {
      console.log(res.text);
      return callback(null, res.text);
    });
  };

  // PROCESS FILE
  var processFile = function(file, callback) {
    // open file
    fs.readFile(dir + file, function(err, data) {
      // bubble up error
      if (err) {
        return callback(
          {
            file: file,
            error: err
          },
          null
        );
      }

      data = data.toString();

      var parsed;
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        return callback(
          {
            file: file,
            error: e
          },
          null
        );
      }

      var traversed = traverse(parsed);

      var targets = {};

      // create targets for every language
      for (var l in languages) {
        var lang = languages[l];
        targets[lang] = traverse(traversed.clone());
      }

      // find all paths of the object keys recursively
      var paths = traversed.paths();

      // translate each path
      async.map(
        paths,
        function(path, done) {
          var text = traversed.get(path);

          // only continue for strings
          if (typeof text !== "string") {
            return done(null);
          }

          // translate every language for this path
          async.map(
            languages,
            function(language, translated) {
              // translate the text
              translate(text, language, function(err, translation) {
                // add new value to path
                targets[language].set(path, translation);

                var e = null;
                if (err === TRANSERR.NOT_TRANSLATED) {
                  e = {
                    file: file,
                    path: path,
                    text: text,
                    source: sourceLanguage,
                    target: language
                  };
                }

                return translated(null, e);
              });

              // all languages have been translated for this path,
              // so call the done callback of the map through all paths
            },
            done
          );
        },

        // all are translated
        function(err, results) {
          // write translated targets to files
          for (var t in targets) {
            var transStr = JSON.stringify(targets[t].value, null, "\t");

            var p = dir + t + ".json";
            fs.writeFileSync(p, transStr);

            // add language to source file
            parsed[t] = true;
          }

          // filter out null results, to just return the not translated ones
          notTranslated = results.filter(function(item) {
            // check if array only contains nulls
            for (var i in item) {
              if (item[i] != null) {
                return true;
              }
            }

            return false;
          });

          // spice up error message
          if (err) {
            err = {
              file: file,
              error: err
            };
          }

          return callback(err, notTranslated);
        }
      );
    });
  };

  // process the source file
  processFile(sourceLanguage + ".json", finish);
  vscode.window.showInformationMessage("Translation is done");
};

/* 
// ! this part is for node testing so i didn't remove it
const startDir = "./"   // File PATH will be here
path.resolve(__dirname, startDir);



run(startDir, "en", ["af","sq","ar","az","eu","bn","be","bg","ca","tr","et","de","hi"], function(err, result) { // start the function 
  console.log("run sikkosu");
  
  if (err) {
    console.log("ERROR:");
    console.log(err);
    process.exit(0);
  }

  process.exit(0);
}); */
// EXPORTS
module.exports = {
  run: run
};
