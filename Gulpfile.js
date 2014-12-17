/**
 * Module dependencies.
 */
var browserify = require('browserify');
var clean = require('gulp-clean');
var connect = require('gulp-connect');
var fs = require('fs');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var minifyCSS = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var notify = require('gulp-notify');
var rename = require('gulp-rename');
var sass = require('gulp-ruby-sass');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var watchify = require('watchify');


/**
 * Assign variables.
 */
var distPath = '_dist';
var timestamp = null;
var paths = {
  data: __dirname + '/data/**/*.*',
  fonts: __dirname + '/fonts/**/*.*',
  images: __dirname + '/img/**/*.*',
  html: __dirname + '/index.html'
};

paths.staticPaths = [
  paths.data,
  paths.images,
  paths.fonts
];

/**
 * Tasks.
 */
gulp.task('compile-sass', function() {
  return gulp.src('sass/app.scss')
    .pipe(sass({sourcemap: true, sourcemapPath: 'sass/scss'}))
    .on('error', function (err) { console.log(err.message); })
    .pipe(gulp.dest('css'))
    .pipe(notify({ message: 'Styles built for dev environment.' }));
});

gulp.task('browserify', function() {
  return browserify('./js/main.js', {debug: true})
    .bundle()
    // pass desired output filename to vinyl-source-stream
    .pipe(source('app.js'))
    // start piping stream to tasks
    .pipe(gulp.dest('./js/'));
});

gulp.task('minify-css', function() {
  timestamp = Date.now();

  return gulp.src('sass/app.scss')
    .pipe(sass())
    .pipe(gulp.dest('css'))
    .pipe(rename({ suffix: '.min.' + timestamp }))
    .pipe(minifyCSS())
    .pipe(gulp.dest(distPath + '/css'))
    .pipe(notify({ message: 'Styles built for dist.' }));
});

gulp.task('minify-html', function() {
  return gulp.src('index.html')
    .pipe(minifyHTML())
    .pipe(gulp.dest(distPath))
    .pipe(notify({ message: 'HTML is minified for dist.' }));
});

gulp.task('minify-js', function() {
  return gulp.src('js/app.js')
    .pipe(uglify())
    .pipe(rename({ suffix: '.min.' + timestamp }))
    .pipe(gulp.dest(distPath + '/js'))
    .pipe(notify({ message: 'JavaScript minified for dist.' }));
});

gulp.task('copy-static', function() {
  return gulp.src(paths.staticPaths)
    .pipe(gulp.dest(distPath + '/data'))
    .pipe(notify({ message: 'Static files moved for dist.' }));
});

gulp.task('clean-dist', function() {
  return gulp.src([distPath + '/'], {read: false})
    .pipe(clean());
});

gulp.task('watch', function() {
  gulp.watch('sass/**/*.scss', ['compile-sass']),
  gulp.watch('js/**/*.js', ['browserify']);
});

gulp.task('update-static-paths', ['minify-html'], function() {
  var css = 'app.min.' + timestamp + '.css';
  var js = 'app.min.' + timestamp + '.js';
  var original = distPath + '/index.html';

  // read contents
  var page = fs.readFileSync(original, 'utf8');

  // update file paths
  var revised = page.replace(/href\=css\/app\.css/, 'href=css/' + css + '').replace(/src\=js\/app\.js/, 'src=js/' + js + '');

  // write to new file
  fs.writeFileSync(original, revised);
  console.log('finished writing to ' + original);
});

gulp.task('webserver', function() {
  connect.server();
});


/**
 * Tasks to run from the terminal.
 */
gulp.task('default', ['webserver'], function() {
  gulp.start('compile-sass', 'browserify', 'watch');
});

gulp.task('test-js', function() {
  return gulp.src(['js/**.js', '!js/app.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(notify({ message: 'JSHint complete.' }));
});

gulp.task('dist', ['clean-dist'], function() {
  gulp.start('minify-css', 'minify-js', 'copy-static', 'update-static-paths');
});
