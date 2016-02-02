var gulp        = require('gulp'),
    yargs       = require('yargs'),
    gulp_if     = require('gulp-if'),
    spawn       = require('child_process').spawn,
    sass        = require('gulp-sass'),
    uglifyjs    = require('gulp-uglify'),
    cssnano     = require('gulp-cssnano'),
    htmlmin     = require('gulp-htmlmin'),
    svgmin      = require('gulp-svgmin'),
    styleModule = require('gulp-style-modules'),
    browserSync = require('browser-sync'),
    bowerFiles  = require('main-bower-files');


// Core

gulp.task('core', function() {
  return gulp.src('core/*.js')
    .pipe(gulp_if(yargs.argv.production, uglifyjs()))
    .pipe(gulp.dest('dist/site/core'))
    .pipe(browserSync.stream());
});

gulp.task('core-watch', function() {
  gulp.watch('core/*.js', ['core']);
});


// Widgets

gulp.task('widgets-html', function() {
  return gulp.src('widgets/**/*.html')
    .pipe(gulp_if(yargs.argv.production, htmlmin({collapseWhitespace: true, minifyJS: true})))
    .pipe(gulp.dest('dist/site/widgets/'))
    .pipe(browserSync.stream());
});

gulp.task('widgets-js', function() {
  return gulp.src('widgets/**/*.js')
    .pipe(gulp_if(yargs.argv.production, uglifyjs()))
    .pipe(gulp.dest('dist/site/widgets/'))
    .pipe(browserSync.stream());
});

gulp.task('widgets-sass', function() {
  return gulp.src('widgets/**/*.sass')
    .pipe(sass())
    .pipe(gulp_if(yargs.argv.production, cssnano()))
    .pipe(styleModule())
    .pipe(gulp.dest('dist/site/widgets/'))
    .pipe(browserSync.stream());
});

gulp.task('widgets-svg', function() {
  return gulp.src('widgets/**/*.svg')
    .pipe(gulp.dest('dist/site/widgets/'))
    .pipe(browserSync.stream());
});

gulp.task('widgets', [
  'widgets-html',
  'widgets-js',
  'widgets-sass',
  'widgets-svg',
]);

gulp.task('widgets-watch', function() {
  gulp.watch('widgets/**/*.html', ['widgets-html']);
  gulp.watch('widgets/**/*.js',   ['widgets-js']);
  gulp.watch('widgets/**/*.sass', ['widgets-sass']);
  gulp.watch('widgets/**/*.svg',  ['widgets-svg']);
});


// Site

gulp.task('site-bower', function() {
//   gulp.src(bowerFiles())
  gulp.src('bower_components/**/*')
    .pipe(gulp_if(yargs.argv.production, gulp_if('*.js', uglifyjs())))
//     .pipe(gulp_if('*.html', htmlmin()))
    .pipe(gulp_if(yargs.argv.production, gulp_if('*.css', cssnano())))
    .pipe(gulp.dest('dist/site/bower_components/'));
});

gulp.task('site-socket-io', function() {
  gulp.src('node_modules/socket.io-client/**')
    .pipe(gulp_if(yargs.argv.production, gulp_if('*.js', uglifyjs())))
    .pipe(gulp.dest('dist/site/socket.io-client'));
});

gulp.task('site-html', function() {
  return gulp.src('site/**/*.html')
//     .pipe(gulp_if(yargs.argv.production, htmlmin({collapseWhitespace: true, minifyJS: true})))
    .pipe(gulp.dest('dist/site/'))
    .pipe(browserSync.stream());
});

gulp.task('site-js', function() {
  return gulp.src('site/**/*.js')
    .pipe(gulp_if(yargs.argv.production, uglifyjs()))
    .pipe(gulp.dest('dist/site/'))
    .pipe(browserSync.stream());
});

gulp.task('site-sass-partials', function() {
  return gulp.src('widgets/_yarnball.sass')
    .pipe(gulp.dest('dist/site/widgets/'))
    .pipe(browserSync.stream());
});

gulp.task('site-sass', ['site-sass-partials'], function() {
  return gulp.src('site/*.sass')
    .pipe(gulp_if('!_*.sass', sass()))
    .pipe(gulp_if(yargs.argv.production, cssnano()))
    .pipe(gulp.dest('dist/site/'))
    .pipe(browserSync.stream());
});

gulp.task('site-png', function() {
  return gulp.src('site/**/*.png')
    .pipe(gulp.dest('dist/site/'))
    .pipe(browserSync.stream());
});

gulp.task('site-svg', function() {
  return gulp.src('site/**/*.svg')
    .pipe(gulp_if(yargs.argv.production, svgmin()))
    .pipe(gulp.dest('dist/site/'))
    .pipe(browserSync.stream());
});

gulp.task('node-names', function() {
  gulp.src('site/node_names.txt')
    .pipe(gulp.dest('dist/site/'));
});

gulp.task('links', function() {
  gulp.src('site/links.txt')
    .pipe(gulp.dest('dist/site/'));
});

gulp.task('site', [
  'core',
  'widgets',
  'site-bower',
  'site-socket-io',
  'site-html',
  'site-js',
  'site-sass',
  'site-png',
  'site-svg',
  'node-names',
  'links',
]);

gulp.task('site-watch', ['core-watch', 'widgets-watch'], function() {
  gulp.watch('site/*.html', ['site-html']);
  gulp.watch('site/*.sass', ['site-sass']);
  gulp.watch('site/*.png',  ['site-png']);
  gulp.watch('site/*.svg',  ['site-svg']);
});


gulp.task('default', ['core', 'widgets', 'site']);


gulp.task('serve', ['default'], function() {
  spawn('node',
        ['server.js'],
        {
          stdio: 'inherit',
          cwd: 'dist/',
        }
       )
});

gulp.task('browser-sync', ['site', 'site-watch'], function() {
  
  browserSync({
    port: 5000,
    ui: {
      port: 5001,
    },
//     notify: false,
    server: {
      baseDir: './dist/site',
    },
//     proxy: {
//       target: 'localhost:3000',
//       ws: true
//     },
    files: [
      "dist/site/*.html",
      "dist/site/widgets/**/*.html",
      "dist/site/*.js",
      "dist/site/*.css",
      "dist/site/*.svg",
      "dist/site/*.png",
    ],
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },
  });
});

