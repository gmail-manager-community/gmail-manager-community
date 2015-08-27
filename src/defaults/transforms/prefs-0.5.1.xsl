<?xml version="1.0"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	version="1.0">
	
	<xsl:template match="/">
		<xsl:apply-templates/>
	</xsl:template>
	
	<xsl:template match="prefs">
		<prefs version="0.5.2">
			<xsl:copy-of select="node()"/>
		</prefs>
	</xsl:template>
</xsl:stylesheet>