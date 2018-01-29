const tree = require("isomorphic-tree");
const { basename, dirname, extname } = require("path");
const fs = require("sf-fs");

const same = { name: name => path => basename(path, extname(path)) === name };
const FILENAME_FORMAT = /^(\d{4})-(\d{2})-(\d{2})-([^\.]*)/;
const page = require("./page");


module.exports = function post({ source, options, ...rest })
{
    const filename = basename(source);
    const parsed = filename.match(FILENAME_FORMAT);

    if (parsed === null)
        throw new Error(`Post ${filename} must have the format YYYY-MM-DD-name.`);

    const [_, year, month, day, name] = parsed;
    const destination = `${dirname(rest.destination)}/${year}/${month}/${day}/${name}`;

    if (fs.tstat(source) === "directory")
    {
        const file = fs.readdir(source).find(same.name(filename));
        const transforms =
        [{
            match: file,
            transform: page,
            options: { ...options, destination: `${destination}/index.html` }
        }];

        return <tree { ...{ source, ...rest, transforms, destination } }/>;
    }
    console.log("YES!");

    throw new Error("DONE");

    mkdirp(directory);

    if (fs.tstat(source) === "directory")
        return <directoryPost { ...{ ...props, ...rest } } />;

    return <filePost { ...{ source, ...rest } } />;



/*

    

    const isDirectory = fs.tstat(path) === "directory";
    const input = isDirectory ? fs.readdir(source).find(same.name(filename)) : source;
    const renderer = extname(input) === ".md" ? require.resolve("./render/markdown") : require.resolve("./render/react");
    const transforms = [{ match: input, transform: render }];

    return <tree { ...{ source, destination: directory, cache, transforms } } />;*/
}



