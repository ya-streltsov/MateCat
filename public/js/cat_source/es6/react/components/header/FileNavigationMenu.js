let React = require('react'),
    SegmentStore = require('../../stores/SegmentStore'),
    SegmentActions = require('../../actions/SegmentActions'),
    SegmentConstants = require('../../constants/SegmentConstants');

class FileNavigationMenu extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};

        this.openMenu = this.openMenu.bind(this);
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    openMenu(){
        UI.toggleFileMenu();
    }

    render() {
        return <div className="breadcrumbs">
            <a href="#" id="pname" onClick={this.openMenu()}>{this.props.project_name}</a>
            <span>&nbsp;(<span>{this.props.job_id}</span>) &gt; <b><span>{this.props.source_rfc} </span> </b> &gt;
                <b><span>{this.props.target_rfc}</span></b></span>
        </div>
    }
}

export default FileNavigationMenu;