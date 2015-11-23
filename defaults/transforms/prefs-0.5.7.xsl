<?xml version="1.0"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                version="1.0">

    <xsl:template match="/">
        <xsl:apply-templates />
    </xsl:template>

    <xsl:template match="prefs">
        <prefs version="0.6">
            <xsl:apply-templates />
        </prefs>
    </xsl:template>

    <xsl:template match="account[@type='global']">
        <account type="global">
            <pref id="general-hide-context-menu" value="false" />
            <pref id="general-hide-tools-menu" value="false" />
            <pref id="general-auto-login" value="false" />
            <pref id="security-secured-connection" value="true" />
            <pref id="toolbar-auto-login" value="false" />
            <pref id="toolbar-auto-check" value="false" />

            <xsl:apply-templates select="pref" />
        </account>
    </xsl:template>

    <xsl:template match="account[@type and @email and @alias]">
        <account>
            <xsl:copy-of select="@*" />

            <pref id="toolbar-display" value="false" />
            <pref id="toolbar-toolbar-id" value="status-bar" />
            <pref id="toolbar-placement" value="always-last" />
            <pref id="toolbar-specific-position" value="0" />
            <pref id="notifications-check" value="true" />

            <xsl:apply-templates select="pref" />
        </account>
    </xsl:template>

    <xsl:template match="pref">
        <xsl:choose>
            <xsl:when test="@id = 'compose-context-menu-mailto'" />
            <xsl:when test="@id = 'compose-context-menu-position'" />
            <xsl:when test="@id = 'toolbar-statusbar-display'" />
            <xsl:when test="@id = 'toolbar-statusbar-always-last'" />
            <xsl:when test="@id = 'toolbar-statusbar-position'" />
            <xsl:when test="@id = 'notifications-clickable-alerts'" />
            <xsl:when test="@id = 'general-secured-connection'" />
            <xsl:when test="@id = 'notifications-alerts-message-count'" />
            <xsl:otherwise>
                <xsl:call-template name="pref2" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template name="pref2">
        <pref>
            <xsl:choose>
                <xsl:when test="@id = 'general-never-save-passwords'">
                    <xsl:attribute name="id">security-never-save-passwords</xsl:attribute>
                    <xsl:copy-of select="@value" />
                </xsl:when>

                <xsl:when test="@id = 'compose-tab-location'">
                    <xsl:copy-of select="@id" />
                    <xsl:choose>
                        <xsl:when test="@value = 0">
                            <xsl:attribute name="value">blank</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 1">
                            <xsl:attribute name="value">current</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 2">
                            <xsl:attribute name="value">focused</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 3">
                            <xsl:attribute name="value">background</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 4">
                            <xsl:attribute name="value">window</xsl:attribute>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="value"></xsl:attribute>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:when>

                <xsl:when test="@id = 'compose-mailto-default'">
                    <xsl:copy-of select="@id" />
                    <xsl:variable name="value" select="@value + 1" />
                    <xsl:attribute name="value">
                        <xsl:value-of select="//account[@type and @email and @alias][position() = $value]/@email" />
                    </xsl:attribute>
                </xsl:when>

                <xsl:when test="@id = 'toolbar-left-click' or @id = 'toolbar-middle-click'">
                    <xsl:copy-of select="@id" />
                    <xsl:choose>
                        <xsl:when test="@value = 2">
                            <xsl:attribute name="value">check-messages</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 3">
                            <xsl:attribute name="value">compose-message</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 5">
                            <xsl:attribute name="value">blank</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 6">
                            <xsl:attribute name="value">current</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 7">
                            <xsl:attribute name="value">focused</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 8">
                            <xsl:attribute name="value">background</xsl:attribute>
                        </xsl:when>
                        <xsl:when test="@value = 9">
                            <xsl:attribute name="value">window</xsl:attribute>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="value"></xsl:attribute>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:when>

                <xsl:when test="@id = 'notifications-switch-account'">
                    <xsl:attribute name="id">toolbar-auto-switch</xsl:attribute>
                    <xsl:copy-of select="@value" />
                </xsl:when>

                <xsl:when test="@id = 'general-automatic-login'">
                    <xsl:attribute name="id">general-auto-login</xsl:attribute>
                    <xsl:copy-of select="@value" />
                </xsl:when>

                <xsl:when test="@id = 'notifications-alerts-snippets'">
                    <xsl:attribute name="id">notifications-display-snippets</xsl:attribute>
                    <xsl:copy-of select="@value" />
                </xsl:when>

                <xsl:otherwise>
                    <xsl:copy-of select="@id" />
                    <xsl:copy-of select="@value" />
                </xsl:otherwise>
            </xsl:choose>
        </pref>
    </xsl:template>
</xsl:stylesheet>