var gulp = require('gulp');
var del = require('del');
var connect = require('gulp-connect');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var cleancss = require('gulp-clean-css');
var htmlmin = require('gulp-htmlmin');
var imagemin = require('gulp-image');
var usemin = require('gulp-usemin');
var htmlclean = require('gulp-htmlclean');
var through = require('through2');
var templateCache = require('gulp-angular-templatecache');

var paths = {
    port: 8000,
    scss: ['./src/assets/styles/*.scss','./src/assets/styles/**/*.scss'],
    css: ['./src/assets/styles/*.css'],
    html: ['src/index.html'],
    views:['src/assets/views/**/*.html'],
    clean: ['./dist/index.html','./dist/assets/fonts/','./dist/assets/images/','./dist/assets/json/','./dist/assets/styles/','./dist/assets/scripts/','./dist/assets/views/'],
    cacheViews:['src/assets/views/blog.html','src/assets/views/'],
    images: './src/assets/images/**/*.*',
    copy: ['./src/assets/fonts/**', './src/assets/json/**','./src/assets/scripts/arale-qrcode.min.js','./src/assets/scripts/arale-qrcode.min.js','./src/assets/scripts/prism.min.js'],
    dev: './src',
    dist: './dist'
};

gulp.task('clean', function () {
    return del.sync(paths.clean);
});

gulp.task('copy', ['clean'], function () {
    return gulp.src(paths.copy, {base: paths.dev})
        .pipe(gulp.dest(paths.dist));
});

gulp.task('sass', function () {
    return gulp.src(paths.scss[0], {base: "./"})
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./'))
        .pipe(connect.reload());
});

gulp.task('viewsCache', function () {
    var options = {
        root:"assets/views/",
        templateHeader:" ",
        templateBody:"App.require.put(\'<%= url %>\',\'<%= contents %>\');",
        templateFooter:" "
    };
    return gulp.src(paths.cacheViews[0])
        .pipe(htmlclean())
        .pipe(templateCache('cache.js',options))
        .pipe(gulp.dest(paths.cacheViews[1]));
});

gulp.task('views', function () {
    return gulp.src(paths.views, {base: paths.dev})
        .pipe(htmlclean())
        .pipe(gulp.dest(paths.dist));
});

gulp.task('html', function () {
    //parse single html for some bugs exp: gulp html --src ./src/index.html
    var src = paths.html;
    if (process.argv.length === 5) {
        src = process.argv[4];
    }
    var options = {
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        removeOptionalTags: false,
        removeComments: true,
        minifyJS: true,
        minifyCSS: true
    };
    return gulp.src(src, {base: paths.dev})
        .pipe(usemin({
            html: [htmlmin(options)],
            css: [cleancss()],
            js: [uglify()],
            inlinejs: [uglify()],
            inlinecss: [cleancss(), 'concat']
        }))
        .pipe(gulp.dest(paths.dist))
        .pipe(connect.reload());
});

gulp.task('images', function () {
    gulp.src(paths.images, {base: paths.dev})
        .pipe(imagemin())
        .pipe(gulp.dest(paths.dist));
});


gulp.task('mdimages', function () {
    gulp.src("dist/**/*.png")
        .pipe(imagemin())
        .pipe(gulp.dest("dist"));
});

gulp.task('connectDev', function () {
    connect.server({
        name: 'Dev App',
        root: paths.dev + "/../",
        port: paths.port,
        livereload: true
    });
});

gulp.task('connectDist', function () {
    connect.server({
        name: 'Dist App',
        root: paths.dist,
        port: paths.port + 1,
        livereload: true
    });
});

gulp.task('watch', function () {
    console.log('Gulp watching changes!');
    gulp.watch(paths.cacheViews[0], ['cacheViews']);
    gulp.watch(paths.scss, ['sass']);
    gulp.watch(paths.html.concat(paths.css), ['html']);
});

gulp.task('default', ['clean', 'copy', 'sass','html','views','images', 'connectDist', 'connectDev', 'watch']);
