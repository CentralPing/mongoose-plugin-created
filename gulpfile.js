'use strict';
/* jshint node: true */

var fs = require('fs');
var args = require('yargs').argv;
var gulp = require('gulp');
var gulpIf = require('gulp-if');
var debug = require('gulp-debug');
var jshint = require('gulp-jshint');
var todo = require('gulp-todo');
var jasmine = require('gulp-jasmine');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var jsdoc2md = require('gulp-jsdoc-to-markdown');

var isDebug = !!args.debug;
var isVerbose = !!args.verbose;
var isStackTrace = !!args.stackTrace;
var cliSrc = args.files;

var config = {
  paths: {
    scripts: ['./**/*.js', '!./**/*.spec.js', '!./node_modules/**/*.js'],
    specs: ['./**/*.spec.js', '!./node_modules/**/*.js'],
    all: ['./**/*.js', '!./node_modules/**/*.js']
  }
};

gulp.task('default', function () {
  // place code for your default task here
});

gulp.task('lint', function () {
  return lint(cliSrc || config.paths.scripts);
});

gulp.task('lint:all', function () {
  return lint(config.paths.all);
});

gulp.task('lint:spec', function () {
  return lint(config.paths.specs);
});

gulp.task('test', ['lint:all'], function () {
  return testRunner(cliSrc || config.paths.specs);
});

gulp.task('watch', ['test:unit'], function () {
  return gulp.watch(cliSrc || config.paths.all, ['test']);
});

gulp.task('todo', function () {
  return gulp.src(config.paths.all)
    .pipe(todo({
      //fileName: 'todo.md',
      verbose: isVerbose,
      //newLine: gutil.linefeed,
      /*
      transformComment: function (file, line, text) {
          return ['| ' + file + ' | ' + line + ' | ' + text];
      },
      transformHeader: function (kind) {
          return ['### ' + kind + 's',
              '| Filename | line # | todo',
              '|:------|:------:|:------'
          ];
      }
      */
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('docs', function() {
  return gulp.src(config.paths.all)
    .pipe(concat('README.md'))
    .pipe(jsdoc2md({template: fs.readFileSync('./readme.hbs', 'utf8')}))
    .on('error', function(err){
      gutil.log('jsdoc2md failed:', err.message);
    })
    .pipe(gulp.dest('.'));
});

function testRunner(src) {
  return gulp.src(src)
    .pipe(gulpIf(isDebug, debug()))
    .pipe(jasmine({
      verbose: isVerbose,
      includeStackTrace: isStackTrace
    }));
}

function lint(src) {
  return gulp.src(src)
    .pipe(gulpIf(isDebug, debug()))
    .pipe(jshint())
    .pipe(jshint.reporter('default', {verbose: isVerbose}));
}
