let React = require('react'),
    SegmentStore = require('../../stores/SegmentStore'),
    SegmentActions = require('../../actions/SegmentActions'),
    SegmentConstants = require('../../constants/SegmentConstants');

class FileNavigationMenu extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    render() {
        return <div className="breadcrumbs">
            <a href="#" id="pname">{this.props.project_name}</a>
            <span>&nbsp;(<span>{this.props.job_id}</span>) &gt; <b><span>{this.props.source_rfc} </span> </b> &gt;
                <b><span>{this.props.target_rfc}</span></b></span>
        </div>
    }
}

export default FileNavigationMenu;