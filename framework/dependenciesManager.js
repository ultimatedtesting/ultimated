import fs from 'fs';
import shelljs from 'shelljs';
import CONFIG from './../config/config';

const DependenciesManager = class {
    constructor() {
        this.buildFrameworkObject();
        //this.buildFrameworkAutocomplete();
        this.createXCodeConfig();
    }

    buildFrameworkAutocomplete() {
        const path = `${CONFIG.FRAMEWORK_WAREHOUSE_FOLDER}/${CONFIG.PAGE_OBJECTS_PATH}`;

        let fileContent = '';

        const files = this.getAllFilesFromDirectory(path);

        fileContent += `export as namespace Framework {\n`;
        files.forEach((pageObjectClass, pageObjectIndex) => {
            fileContent += `    interface ${pageObjectClass.fileName} {\n`;

            let methods;
            methods = this.getAllMethods(require(`./${pageObjectClass.path}`).default);

            methods.forEach((methodName, methodIndex) => {
                fileContent += `        ${methodName}(): void;\n`;
            });

            fileContent += '    }\n';
        });
        fileContent += `}`;

        fs.writeFile("framework/autocomplete/framework.d.ts", fileContent, function(err) {
            if(err) {
                return console.log(err);
            }
        });
    }

    async buildFrameworkObject() {
        const path = `${CONFIG.FRAMEWORK_WAREHOUSE_FOLDER}/${CONFIG.PAGE_OBJECTS_PATH}`;

        let fileContent = '';

        const files = this.getAllFilesFromDirectory(path);
        files.forEach((pageObjectData) => {
            fileContent += `import ${pageObjectData.fileName} from '.${pageObjectData.path.replace(CONFIG.FRAMEWORK_WAREHOUSE_FOLDER, '')}';\n`;
        });

        fileContent += `\nexport default {\n`;
        files.forEach((pageObjectClass, pageObjectIndex) => {
            fileContent += `    ${pageObjectClass.fileName}: {\n`;

            let methods;
            methods = this.getAllMethods(require(`${PROJECT_RELATIVE_PATH}${pageObjectClass.path}`).default);

            methods.forEach((methodName, methodIndex) => {
                fileContent += `        ${methodName}: ${pageObjectClass.fileName}.${methodName}`;

                if (methodIndex === methods.length - 1) {
                    fileContent += '\n';
                } else {
                    fileContent += ',\n';
                }
            });

            if (pageObjectIndex === files.length - 1) {
                fileContent += '    }\n';
            } else {
                fileContent += '    },\n';
            }
        });
        fileContent += `};`;

        fs.writeFile(".ultimated/framework.js", fileContent, function(err) {
            if(err) {
                return console.log(err);
            }
        });
    }

    getAllMethods(object) {
        const methods = [];

        if (object) {
            for (let name of Object.getOwnPropertyNames(Object.getPrototypeOf(object))) {
                let method = object[name];
                if ((!(method instanceof Function) || method === object)) continue;
                if (name !== 'constructor') {
                    methods.push(name);
                }
            }
        }

        return methods;
    }

    getAllFilesFromDirectory(dir, fileList = []) {
        const fs = fs || require('fs');
        const files = fs.readdirSync(dir);

        files.forEach(function(fileName) {
            let path = `${dir}/${fileName}`;

            if (fs.statSync(dir + '/' + fileName).isDirectory()) {
                fileList = this.getAllFilesFromDirectory(path, fileList);
            }
            else {
                fileName = fileName.replace('.js', '');
                path = path.replace('.js', '');
                fileList.push({fileName, path});
            }
        }.bind(this));
        return fileList;
    }

    createXCodeConfig() {
        const fileContent = `DEVELOPMENT_TEAM = ${PROJECT_CONFIG.DEVELOPMENT_TEAM_ID}\nCODE_SIGN_IDENTITY = iPhone Developer`;

        fs.writeFile(`${global.FRAMEWORK_RELATIVE_PATH}/xcode.conf`, fileContent, function(err) {
            if(err) {
                return console.log(err);
            }
        });
    }
};

export default new DependenciesManager();
