# adapters/documents

Enforces the two-document schema server-side, so calling the API directly cannot
create a third document type — in v1 this rule lived only in frontend
validation.

Accepts both tag forms in a model reply:

```
[DOC_UPDATE: plan | # Plan ...]
[DOC_UPDATE: plan]# Plan ...[/DOC_UPDATE]
```

Uploads are limited to `.md`/`.txt` and `ARCHI_MAX_UPLOAD_BYTES`. Every accepted
write runs through governance first and appends to `versions[]`; nothing
overwrites history.
