import shelljs from 'shelljs';

const CommonUtils = class {
    getMainPath () {
        return __dirname.replace(/\\framework/, '').replace(/\/framework/, '');
    }

    isFileLineCommented (line) {
        return !line.indexOf('//');
    }

    getStringBetweenSingleQuotes (line) {
        return line.split(/'/)[1];
    }

    getStringBetweenDoubleQuotes (line) {
        return line.split(/"/)[1];
    }

    getProjectPathRelativeToFrameworkPath (fileTreePosition) {
        const projectAbsolutePath = shelljs.exec('pwd', {silent:true}).stdout.replace(/(\r\n|\n|\r)/gm,"");
        const frameworkAbsolutePath = __dirname;
        const commonRootPath = this._getCommonRootPathFromTwoStrings(projectAbsolutePath, frameworkAbsolutePath);
        const projectPath = projectAbsolutePath.replace(commonRootPath, '');
        const frameworkPath = frameworkAbsolutePath.replace(commonRootPath, '');
        let slashesCount = this._getStringSlashesCount(frameworkPath);

        if (fileTreePosition) {
            slashesCount = slashesCount + fileTreePosition;
        }

        let relativeProjectPath = './';

        while (slashesCount--) {
            relativeProjectPath = `${relativeProjectPath}../`;
        }

        relativeProjectPath = `${relativeProjectPath}${projectPath}/`

        return relativeProjectPath;
    }

    getFrameworkPathRelativeToProjectPath (fileTreePosition) {
        const projectAbsolutePath = shelljs.exec('pwd', {silent:true}).stdout.replace(/(\r\n|\n|\r)/gm,"");
        const frameworkAbsolutePath = __dirname;
        const commonRootPath = this._getCommonRootPathFromTwoStrings(projectAbsolutePath, frameworkAbsolutePath);
        const projectPath = projectAbsolutePath.replace(commonRootPath, '');
        const frameworkPath = frameworkAbsolutePath.replace(commonRootPath, '');
        let slashesCount = this._getStringSlashesCount(projectPath);

        if (fileTreePosition) {
            slashesCount = slashesCount + fileTreePosition;
        }

        let relativeFrameworkPath = './';

        while (slashesCount--) {
            relativeFrameworkPath = `${relativeFrameworkPath}../`;
        }

        relativeFrameworkPath = `${relativeFrameworkPath}${frameworkPath}/`;

        return relativeFrameworkPath;
    }

    _getCommonRootPathFromTwoStrings (path1, path2) {
        let isPathRoot = true;
        let i = 1;
        let tempString = path2.substring(0, i);

        while (path1.startsWith(tempString)) {
            i++;
            tempString = path2.substring(0, i);
        }

        tempString = tempString.substring(0, tempString.length - 1);

        return tempString;
    }

    _getStringSlashesCount (string) {
        return string.split('\/').length - 1 ;
    }
};

export default new CommonUtils();