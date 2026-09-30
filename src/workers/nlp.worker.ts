import keyword_extractor from 'keyword-extractor';

self.onmessage = (e: MessageEvent) => {
    const { id, title, subtitle, content, maxTags } = e.data;

    try {
        const cleanContent = content ? content.replace(/<[^>]*>?/gm, ' ') : '';
        const combinedText = `${title || ''} ${title || ''} ${subtitle || ''} ${cleanContent}`;

        if (!combinedText.trim()) {
            self.postMessage({ id, keywords: [] });
            return;
        }

        const extractionResult = keyword_extractor.extract(combinedText, {
            language: "french",
            remove_digits: true,
            return_changed_case: true,
            remove_duplicates: true
        });

        const filtered = extractionResult
            .filter(word => word.length > 2)
            .slice(0, maxTags || 5);

        self.postMessage({ id, keywords: filtered });
    } catch (error: any) {
        self.postMessage({ id, error: error.message || 'Error extracting keywords' });
    }
};
