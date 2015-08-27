<?xml version="1.0"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	version="1.0">
	
	<xsl:template match="/">
		<xsl:apply-templates/>
	</xsl:template>
	
	<xsl:template match="gmanager">
		<prefs version="0.5.1">
			<xsl:apply-templates/>
		</prefs>
	</xsl:template>
	
	<xsl:template match="account">
		<account>
			<xsl:copy-of select="@*"/>
			
			<xsl:apply-templates select="pref[not(@id = 'toolbar-tab-location')]"/>
		</account>
	</xsl:template>
	
	<xsl:template match="pref">
		<pref>
			<xsl:copy-of select="@*"/>
			
			<xsl:if test="(@id = 'toolbar-left-click' or @id = 'toolbar-middle-click') and @value = 4">
				<xsl:attribute name="value">
					<xsl:value-of select="//pref[@id = 'toolbar-tab-location']/@value + 5"/>
				</xsl:attribute>
			</xsl:if>
		</pref>
	</xsl:template>
</xsl:stylesheet>