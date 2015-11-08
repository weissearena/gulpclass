import {Gulpclass, Task, SequenceTask} from "./src/Annotations";
import * as gulp from "gulp";

const del: any = require('del');
const shell: any = require('gulp-shell');
const fs: any = require('fs');
const replace: any = require('gulp-replace');
const dtsGenerator: any = require('dts-generator').default;

@Gulpclass()
export class Gulpfile {

    /**
     * Cleans compiled files.
     */
    @Task()
    cleanCompiled(cb: Function) {
        return del(['./build/es5/**'], cb);
    }

    /**
     * Cleans generated package files.
     */
    @Task()
    cleanPackage(cb: Function) {
        return del(['./build/package/**'], cb);
    }

    /**
     * Runs typescript files compilation.
     */
    @Task()
    compile() {
        return gulp.src('*.js', { read: false })
            .pipe(shell([
                './node_modules/.bin/tsc'
            ]));
    }

    /**
     * Copies all files that will be in a package.
     */
    @Task()
    packageFiles() {
        return gulp.src('./build/es5/src/*')
            .pipe(gulp.dest('./build/package'));
    }

    /**
     * Change the "private" state of the packaged package.json file to public.
     */
    @Task()
    packagePreparePackageFile() {
        return gulp.src('./package.json')
            .pipe(replace('"private": true,', '"private": false,'))
            .pipe(gulp.dest('./build/package'));
    }

    /**
     * This task will replace all typescript code blocks in the README (since npm does not support typescript syntax
     * highlighting) and copy this README file into the package folder.
     */
    @Task()
    packageReadmeFile() {
        return gulp.src('./README.md')
            .pipe(replace(/```typescript([\s\S]*?)```/g, '```javascript$1```'))
            .pipe(gulp.dest('./build/package'));
    }

    /**
     * Generates a .d.ts file that is needed for the npm package and will be imported by others.
     */
    @Task()
    packageGenerateDts(cb: Function) {
        let name = require(__dirname + '/../../package.json').name;
        dtsGenerator({
            name: name,
            baseDir: './src',
            files: this.getFiles('./src'),
            out: './build/package/' + name + '.d.ts'
        });
        cb();
    }

    /**
     * Creates a package that can be published to npm.
     */
    @SequenceTask()
    package() {
        return [
            ['cleanCompiled', 'cleanPackage'],
            'compile',
            ['packageFiles', 'packagePreparePackageFile', 'packageReadmeFile', 'packageGenerateDts']
        ];
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private getFiles(dir: string, files: string[] = []): string[] {
        var filesInDir = fs.readdirSync(dir);
        for (var i in filesInDir) {
            var name = dir + '/' + filesInDir[i];
            if (fs.statSync(name).isDirectory()) {
                this.getFiles(name, files);
            } else {
                files.push(name);
            }
        }
        return files;
    }

}