"""Filters for the golden_path role."""
import base64
import hashlib


def golden_path_changed_files(files, tree):
    """The files whose content differs from the same path in a Gitea tree.

    files: [{path, content (base64)}], as built by tasks/repo-files.yml.
    tree: the "tree" list of Gitea's git/trees API (path, type, sha).
    Returns those files that exist in the tree with other content, each with the
    tree's sha added (the contents API needs it to replace the file). Git names a
    file's content by sha1("blob <size>\\0" + bytes), so nothing has to be fetched.
    """
    blobs = {entry['path']: entry['sha'] for entry in tree if entry.get('type') == 'blob'}
    changed = []
    for item in files:
        sha = blobs.get(item['path'])
        if sha is None:
            continue
        data = base64.b64decode(item['content'])
        if hashlib.sha1(b'blob %d\0' % len(data) + data).hexdigest() != sha:
            changed.append(dict(item, sha=sha))
    return changed


class FilterModule:
    def filters(self):
        return {'golden_path_changed_files': golden_path_changed_files}
