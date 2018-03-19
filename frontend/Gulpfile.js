var gulp = require('gulp'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    cssmin = require('gulp-cssmin'),
    rename = require('gulp-rename');

gulp.task('sass', function () {
    return gulp.src('./scss/styles.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([
            autoprefixer({browsers: ['last 2 versions']})
        ]))
        .pipe(gulp.dest('./styles'));
});

gulp.task('sass:uglify', function () {
    return gulp.src('./styles/styles.css')
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./styles'));

});

gulp.task('sass:watch', function () {
    gulp.watch('./scss/**/*.scss', ['sass', 'sass:uglify']);
});
