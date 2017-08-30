show_project_prompt () {
    echo ""
    echo "Ultimated installation complete"
    if [[ $(which android) ]] && [[ $(which java) ]]; then
        echo "Android environment already installed"
    else
        echo ""
        echo "To install android environment, type:"
        echo "  ultimated install android"
    fi
    echo ""
    echo "To start a new project, type:"
    echo "  ultimated create project_name"
    echo ""
    echo "Happy testing!"
    echo ""
}

unix_setup () {
    pwd=`pwd`

    echo "Downloading Ultimated..."

    RELEASE_VERSION="$(curl http://ultimatedtesting.com/install/release-version 2>/dev/null)"

    mkdir ~/.ultimated
    cd ~/.ultimated
    mkdir packages
    mkdir bin
    cd ~/.ultimated/packages
    mkdir node-suites
    mkdir ultimated-core

    curl --progress-bar https://nodejs.org/dist/v6.11.0/node-v6.11.0-$1-x64.tar.gz --output ./node.tar.xz
    tar xf node.tar.xz
    rm node.tar.xz
    mv ~/.ultimated/packages/node-v6.11.0-$1-x64 ~/.ultimated/packages/node-suites/node
    echo "Done"
    echo ""

    curl --progress-bar http://ultimatedtesting.com/install/ultimated-core-$RELEASE_VERSION.tar.gz --output ./ultimated.tar.gz
    tar xf ultimated.tar.gz
    rm ultimated.tar.gz
    mv ./tarball/$RELEASE_VERSION ~/.ultimated/packages/ultimated-core
    rm -r tarball
    mv ~/.ultimated/packages/ultimated-core/$RELEASE_VERSION/ultimated ~/.ultimated/bin/ultimated
    chmod +x ~/.ultimated/bin/ultimated
    chmod +x ~/.ultimated/packages/ultimated-core/$RELEASE_VERSION/create.sh
    chmod +x ~/.ultimated/packages/ultimated-core/$RELEASE_VERSION/update

    RELEASE_NODE_SUITE=`cat ~/.ultimated/packages/ultimated-core/$RELEASE_VERSION/release-node-suite`
    mv ~/.ultimated/packages/node-suites/node ~/.ultimated/packages/node-suites/$RELEASE_NODE_SUITE
    mv ~/.ultimated/packages/ultimated-core/$RELEASE_VERSION/package.json ~/.ultimated/packages/node-suites/$RELEASE_NODE_SUITE/lib
    touch ~/.bashrc
    echo "export PATH=\"~/.ultimated/bin:\$PATH\"" >> ~/.bashrc
    export PATH="~/.ultimated/bin:$PATH"
    echo "Done"
    echo ""

    echo "Installing packages..."
    cd ~/.ultimated/packages/node-suites/$RELEASE_NODE_SUITE/lib
    ~/.ultimated/packages/node-suites/$RELEASE_NODE_SUITE/bin/node ~/.ultimated/packages/node-suites/$RELEASE_NODE_SUITE/bin/npm install
    ln -s ~/.ultimated/packages/node-suites/$RELEASE_NODE_SUITE/lib/node_modules ~/.ultimated/packages/ultimated-core/$RELEASE_VERSION/node_modules
    ln -s ~/.ultimated/packages/ultimated-core/$RELEASE_VERSION ~/.ultimated/packages/ultimated-core/latest
    echo "Done"
    echo ""

    cd $pwd

    show_project_prompt

exec bash
}

system_specific_setup () {
    SYSTEM=`uname`

    if [ "$SYSTEM" = "Darwin" ] ; then
        unix_setup darwin
    elif [ "$SYSTEM" = "Linux" ] ; then
        unix_setup linux
    else
        echo "Sorry, this operating system is not supported yet"
    fi
}

install () {
    system_specific_setup
}

install