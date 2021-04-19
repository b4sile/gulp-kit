'use strict';

const project_folder = 'build';
const source_folder = 'src';

const path = {
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    img: project_folder + '/img/',
    js: project_folder + '/js/',
    fonts: project_folder + '/fonts/',
  },
  src: {
    html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
    css: source_folder + '/sass/style.scss',
    img: source_folder + '/img/**/*.{jpg,png,svg,jpeg}',
    js: source_folder + '/js/script.js',
    fonts: source_folder + '/fonts/*.ttf',
  },
  watch: {
    html: source_folder + '/**/*.html',
    css: source_folder + '/sass/**/*.scss',
    img: source_folder + '/img/**/*.{jpg,png,svg}',
    js: source_folder + '/js/**/*.js',
  },
  clean: './' + project_folder + '/',
};

const { src, dest, parallel, series, watch, task } = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const file_include = require('gulp-file-include');
const del = require('del');
const tildeImporter = require('node-sass-tilde-importer');
const autoprefixer = require('gulp-autoprefixer');
const sassGlob = require('gulp-sass-glob');
const cssbeautify = require('gulp-cssbeautify');
const cleanCSS = require('gulp-clean-css');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const gcmq = require('gulp-group-css-media-queries');
const uglify = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');

function browsersync() {
  browserSync.init({
    // Инициализация Browsersync
    server: { baseDir: './' + project_folder + '/' }, // Указываем папку сервера
    notify: false, // Отключаем уведомления
    online: false, // Режи�� работы: true или false
    port: 3000,
  });
}

function html() {
  return (
    src(path.src.html)
      .pipe(file_include())
      // .pipe(webphtml())
      .pipe(dest(path.build.html))
      .pipe(browserSync.stream())
  );
}

function fonts() {
  return src(path.src.fonts)
    .pipe(dest(path.build.fonts))
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
    .pipe(src(path.src.fonts))
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
}

function images() {
  return (
    src(path.src.img)
      // .pipe(
      //   webp({
      //     quality: 70,
      //   })
      // )
      // .pipe(dest(path.build.img))
      // .pipe(src(path.src.img))
      // .pipe(
      //   imagemin({
      //     progressive: true,
      //     svgoPlugins: [{ removeViewBox: false }],
      //     interlaced: true,
      //     optimizationLevel: 3,
      //   })
      // )
      .pipe(dest(path.build.img))
      .pipe(browserSync.stream())
  );
}

function js() {
  return src(path.src.js)
    .pipe(file_include())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: '.min.js',
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream());
}

function clean() {
  return del(path.clean);
}

function startwatch() {
  watch([path.watch.html], html);
  watch([path.watch.css], css);
  watch([path.watch.js], js);
  watch([path.watch.img], images);
  // watch('source/**/*.js').on('change', browserSync.reload);
}

function css() {
  return src(path.src.css)
    .pipe(plumber())
    .pipe(
      sassGlob({
        ignorePaths: ['blocks/button.scss', 'blocks/body.scss'],
      })
    )
    .pipe(
      sass({
        outputStyle: 'expanded',
        importer: tildeImporter,
      })
    )
    .pipe(gcmq())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 5 versions'],
        grid: true,
        cascade: true,
      })
    )
    .pipe(
      cssbeautify({
        indent: '  ',
        openbrace: 'separate-line',
        autosemicolon: true,
      })
    )
    .pipe(dest(path.build.css))
    .pipe(cleanCSS())
    .pipe(
      rename({
        extname: '.min.css',
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream());
}

task('otf2ttf', function () {
  return src([source_folder + '/fonts/*.otf'])
    .pipe(
      fonter({
        formats: ['ttf'],
      })
    )
    .pipe(dest(source_folder + '/fonts/'));
});

task('svgSprite', function () {
  return src([source_folder + '/iconsprite/*.svg'])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../icons/icons.svg',
            // example: true
          },
        },
      })
    )
    .pipe(dest(path.build.img));
});

const build = series(clean, parallel(html, css, images, js));
const gulp_watch = parallel(build, startwatch, browsersync);

exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.build = build;
exports.default = gulp_watch;
exports.watch = gulp_watch;
exports.html = html;
