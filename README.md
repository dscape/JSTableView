#JSTableView

## What is it?

__JSTableView__ is a library which efficiently presents long, scrollable lists in HTML pages, inspired by the behavior of native iOS lists (UITableView).

## How does it work?
In native apps, these lists do not simply load up an entire set of data elements and scroll them up and down - rather, they only use enough cells to fill the viewing area. Cells that scroll out of the visible area are "recycled" and pushed onto the top or the bottom of the list, depending on the scroll direction - sort of like how the Druids might have moved a giant slab of stone in Ancient England, using rolling logs. As each log rolls out from the back of the stone, it is moved in front of the stone, and the process is repeated until Stonehenge is complete. This is comparatively efficient solution - there are a limited number of cells "in play" at any given point, taking up memory, requiring positioning and redrawing.

## Documentation

The source code is documented using [docco](//jashkenas.github.com/docco/) and you can find that documentation in the `docs` directory.

As for a quickstart, it really is as simple as including the source files and stylesheets, create a container object (I like using `divs`, but any block element will work) and, after the document has loaded (`$(document).ready()`, `$()`, or body onLoad), call `JSTableView.tableViewWithOptions`, passing in an options object as a parameter. The currently supported options are:

* __selector__: _[required]_ a CSS selector for an element which will serve as the container for the tableView. 

* __momentumFPS__: _[optional; default = 20]_ number of times per second to update the position of the list during momentum flow.

* __containerClassName__: _[optional; default = 'jsTableView']_ the className applied to the outer block container.

* __data__: _[optional; default = []]_ array of data elements. Data elements are objects composed of the following parameters:
 
    {
 
    __id__: _[optional; default = '']_ id to be applied to the list element.
 
    __className__: _[optional; default = '']_ className to be applied to the list element.
 
    __text__: _[optional; default = '']_ text added to the list element via innerHTML.
 
    __click__: _[optional]_ a function to be applied to the onClick event.
 
 	}

## Examples

Check out the source in examples/list, [or visit a working copy from your iDevice or Android](http:mattnunes.com/lab/list). Yes, there really are 5000 individual pieces of data in the list - check the source! 

## Contributors
[Matt Nunes](github.com/mattnunes)

[Dan Pinter](github.com/DataZombies)

[Jonathan Stark](github.com/jonathanstark)

##License
__The MIT License (MIT)__
Copyright © 2011-2012 Mobiquity, Inc


Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:


The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.


THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 