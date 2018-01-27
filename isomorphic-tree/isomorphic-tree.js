const { basename, dirname, join } = require("path");
const fs = require("sf-fs");
const micromatch = require("micromatch");
const filesystemCache = require("./filesystem-cache");


module.exports = function tree({ source, destination, cache, exclude, ...rest })
{
    fs.mkdirp(dirname(destination));

    const transforms = rest.transforms.map(({ match, ...rest }) =>
        ({ match: toMatcher(match), ...rest }));

    return  <item   source = { source }
                    destination = { destination }
                    cache = { fs.mkdirp(cache) }
                    exclude = { toMatcher(exclude) }
                    transforms = { transforms } />;
}


function item({ source, exclude, ...rest })
{
    if (exclude(source))
        return [];

    const type = { file, directory }[fs.tstat(source)];

    return <type { ...{ source, exclude, ...rest } } />;
}

function file({ source, destination, cache, transforms })
{
    const match = transforms.find(transform => transform.match(source));

    if (!match)
        return <copy { ...{ source, destination } }/>;

    const { transform: location, ...rest } = match;
    const transform = require(location);

    return  <copy { ...{ destination } }>
                <filesystemCache
                    cache = { cache }
                    transform = { <transform { ...{ ...rest, cache, source, destination } } /> } />
            </copy>;
}

function copy({ children:[nested], destination, source = nested.include })
{
    fs.copy(source, nested && nested.destination || destination);

    return nested;
}

function directory({ source, destination, ...rest })
{
    fs.mkdirp(destination);

    return fs.readdir(source).map(source =>
        <item   { ...{ source, ...rest } }
                destination = { join(destination, basename(source)) } />);
}

function toMatcher(match)
{
    if (Array.isArray(match))
    {
        const matchers = match.map(toMatcher);

        return path => matchers.some(matcher => matcher(path));
    }

    if (typeof match === "string")
    {
        const matcher = new micromatch.matcher(match);

        return path => matcher(path);
    }

    if (typeof match === "function")
        return match;

    return () => false;
}
